import { XMLParser } from 'fast-xml-parser';
import { getFallbackPolicies } from '../data/fallbackPolicies.ts';
import { parseUtcMidnight } from '../lib/date.ts';
import { isSafeHttpUrl } from '../lib/url.ts';
import type {
  PoliciesApiMeta,
  PoliciesApiResponse,
  PolicyField,
  PolicyRegion,
  PolicySource,
  YouthPolicy,
} from '../types/policy.ts';

const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3시간 인메모리 캐시 (1~6시간 권장 범위)
const REFRESH_COOLDOWN_MS = 15 * 1000;

interface CacheEntry {
  data: PoliciesApiResponse;
  expiresAt: number;
  lastRefreshTriggerAt: number;
}

let policyCache: CacheEntry | null = null;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
  parseTagValue: true,
});

/**
 * 공공데이터포털 디코딩 키 기준 이중 인코딩 방지 유틸리티.
 * 이미 퍼센트 인코딩된 키가 들어온 경우에도 1회 안전하게 디코딩한 뒤
 * 서버에서 정확히 1회만 encodeURIComponent를 적용합니다.
 */
export function encodeServiceKeyOnce(rawKey: string): string {
  const trimmed = rawKey.trim();
  let decoded = trimmed;
  if (/%[0-9A-Fa-f]{2}/.test(trimmed)) {
    try {
      decoded = decodeURIComponent(trimmed);
    } catch {
      decoded = trimmed;
    }
  }
  return encodeURIComponent(decoded);
}

function mapFieldCategory(rawText: string): PolicyField {
  const t = rawText.toLowerCase();
  if (/주거|월세|전세|임대|보증금|주택/.test(t)) return '주거';
  if (/창업|벤처|스타트업|사업화/.test(t)) return '창업';
  if (/금융|저축|대출|자산|적금|교통비|장학|지원금|수당/.test(t)) return '금융·자산';
  if (/교육|훈련|부트캠프|대학|학자금|자격증|디지털/.test(t)) return '교육';
  if (/복지|건강|심리|상담|돌봄|의료|소득|생계/.test(t)) return '복지·건강';
  return '일자리';
}

function mapRegionCategory(rawText: string): PolicyRegion {
  const t = rawText.trim();
  if (!t || /전국|중앙|전역/.test(t)) return '전국';
  if (/서울/.test(t)) return '서울';
  if (/경기/.test(t)) return '경기';
  if (/인천/.test(t)) return '인천';
  if (/부산/.test(t)) return '부산';
  if (/대구/.test(t)) return '대구';
  if (/대전/.test(t)) return '대전';
  if (/광주/.test(t)) return '광주';
  return '기타 지역';
}

function extractDeadlineIso(periodText: string): string | null {
  if (!periodText || /상시|연중|수시/.test(periodText)) {
    return null;
  }
  const matches = periodText.match(/20\d{2}[.\-/]\d{1,2}[.\-/]\d{1,2}/g);
  if (matches && matches.length > 0) {
    const lastDate = matches[matches.length - 1].replace(/[./]/g, '-');
    const parts = lastDate.split('-');
    if (parts.length === 3) {
      const normalized = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      if (parseUtcMidnight(normalized) !== null) {
        return normalized;
      }
    }
  }
  const compactMatches = periodText.match(/20\d{6}/g);
  if (compactMatches && compactMatches.length > 0) {
    const c = compactMatches[compactMatches.length - 1];
    const normalized = `${c.slice(0, 4)}-${c.slice(4, 6)}-${c.slice(6, 8)}`;
    if (parseUtcMidnight(normalized) !== null) {
      return normalized;
    }
  }
  return null;
}

function toStringArray(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    return raw
      .split(/[\n,;•·]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 2);
  }
  return ['공고문 내 세부 제출서류 확인 필요'];
}

function pickFirstText(...candidates: unknown[]): string {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim().length > 0) {
      return c.trim();
    }
    if (typeof c === 'number') {
      return String(c);
    }
  }
  return '';
}

/**
 * HTTP 200 응답이라도 본문에 공공 API 에러 코드가 담긴 경우를 탐지합니다.
 */
function assertNoPublicApiBodyError(rawBody: string, parsedObj: Record<string, unknown> | null): void {
  if (rawBody.includes('OpenAPI_ServiceResponse') || rawBody.includes('SERVICE_KEY_IS_NOT_REGISTERED_ERROR')) {
    throw new Error('공공데이터 API 인증키가 유효하지 않거나 서비스 미승인 상태입니다.');
  }

  if (!parsedObj) return;

  const header = (parsedObj.OpenAPI_ServiceResponse as Record<string, unknown> | undefined)
    ?.cmmMsgHeader as Record<string, unknown> | undefined;
  if (header?.errMsg || header?.returnReasonCode) {
    throw new Error(String(header.errMsg || `API 오류 코드 ${header.returnReasonCode}`));
  }

  const responseHeader = (parsedObj.response as Record<string, unknown> | undefined)
    ?.header as Record<string, unknown> | undefined;
  if (responseHeader?.resultCode && String(responseHeader.resultCode) !== '00') {
    throw new Error(String(responseHeader.resultMsg || `resultCode=${responseHeader.resultCode}`));
  }

  if (typeof parsedObj.code === 'number' && parsedObj.code < 0) {
    throw new Error(String(parsedObj.msg || `API error code ${parsedObj.code}`));
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<string> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json, application/xml, text/xml',
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from upstream public API`);
  }

  return response.text();
}

/**
 * 1) 한국고용정보원 온통청년 청년정책 API 연동 및 정규화
 */
async function fetchOntongYouthPolicies(apiKey: string): Promise<YouthPolicy[]> {
  const encodedKey = encodeServiceKeyOnce(apiKey);
  const url = `https://www.youthcenter.go.kr/opi/youthPlcyList.do?openApiVlak=${encodedKey}&display=15&pageIndex=1`;
  const rawText = await fetchWithTimeout(url);

  let parsed: Record<string, unknown>;
  if (rawText.trim().startsWith('{')) {
    parsed = JSON.parse(rawText) as Record<string, unknown>;
  } else {
    parsed = xmlParser.parse(rawText) as Record<string, unknown>;
  }

  assertNoPublicApiBodyError(rawText, parsed);

  const root = (parsed.youthPolicyList || parsed) as Record<string, unknown>;
  const rawItems = root.youthPolicy;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

  return items
    .map((item: Record<string, unknown>, idx: number): YouthPolicy | null => {
      const title = pickFirstText(item.polyBizSjnm, item.plcyNm);
      if (!title) return null;

      const summary = pickFirstText(item.polyItcnCn, item.plcyExplnCn, title);
      const period = pickFirstText(item.rqutPrdCn, item.aplyYmd, '상시 신청');
      const orgName = pickFirstText(item.mngtMson, item.sprvsnInstCdNm, '온통청년 연계기관');
      const rawUrl = pickFirstText(item.rqutUrla, item.aplyUrlAddr);
      const applyUrl = isSafeHttpUrl(rawUrl) ? rawUrl : 'https://www.youthcenter.go.kr';

      return {
        id: `ontong-live-${pickFirstText(item.bizId, item.plcyNo, idx)}`,
        title,
        source: '온통청년',
        orgName,
        field: mapFieldCategory(`${title} ${pickFirstText(item.polyRlmCd, item.lclsfNm)} ${summary}`),
        region: mapRegionCategory(pickFirstText(item.polyBizSecd, orgName)),
        summary,
        target: pickFirstText(item.ageInfo, item.prcpCn, '만 19세~34세 청년 (세부 요건 공고 참조)'),
        supportContent: pickFirstText(item.sporCn, item.plcySprtCn, summary),
        period,
        deadlineIso: extractDeadlineIso(period),
        requiredDocs: toStringArray(item.pstnPaprCn || item.sbmsnDcmntCn),
        applyMethod: pickFirstText(item.rqutProcCn, item.plcyAplyMthdCn, '온통청년 또는 소관기관 누리집 접수'),
        applyUrl,
        contactInfo: pickFirstText(item.cherCtpcCn, item.operInstTelno),
      };
    })
    .filter((p): p is YouthPolicy => p !== null);
}

/**
 * 2) 행정안전부 대한민국 공공서비스(혜택) 정보 API (보조금24) 연동 및 정규화
 */
async function fetchBojo24Policies(apiKey: string): Promise<YouthPolicy[]> {
  const encodedKey = encodeServiceKeyOnce(apiKey);
  const url = `https://api.odcloud.kr/api/gov24/v3/serviceList?page=1&perPage=20&serviceKey=${encodedKey}`;
  const rawText = await fetchWithTimeout(url);
  const parsed = JSON.parse(rawText) as Record<string, unknown>;

  assertNoPublicApiBodyError(rawText, parsed);

  const items = Array.isArray(parsed.data) ? (parsed.data as Record<string, unknown>[]) : [];
  return items
    .filter((item) => {
      const text = `${item['서비스명'] ?? ''} ${item['지원대상'] ?? ''} ${item['서비스목적요약'] ?? ''}`;
      return /청년|대학생|사회초년생|취업|월세|장학/.test(text);
    })
    .slice(0, 10)
    .map((item, idx): YouthPolicy => {
      const title = pickFirstText(item['서비스명'], '공공서비스 지원');
      const summary = pickFirstText(item['서비스목적요약'], item['지원내용'], title);
      const period = pickFirstText(item['신청기한'], '상시 신청');
      const rawUrl = pickFirstText(item['상세조회URL']);
      const applyUrl = isSafeHttpUrl(rawUrl) ? rawUrl : 'https://www.gov.kr';

      return {
        id: `bojo24-live-${pickFirstText(item['서비스ID'], idx)}`,
        title,
        source: '보조금24',
        orgName: pickFirstText(item['소관기관명'], item['부서명'], '행정안전부 보조금24'),
        field: mapFieldCategory(`${title} ${item['서비스분야'] ?? ''} ${summary}`),
        region: mapRegionCategory(pickFirstText(item['소관기관명'], item['소관기관유형'])),
        summary,
        target: pickFirstText(item['지원대상'], item['선정기준'], '지원 대상 공고 확인 필요'),
        supportContent: pickFirstText(item['지원내용'], summary),
        period,
        deadlineIso: extractDeadlineIso(period),
        requiredDocs: toStringArray(item['구비서류']),
        applyMethod: pickFirstText(item['신청방법'], item['접수기관'], '정부24/보조금24 온라인 또는 방문 신청'),
        applyUrl,
        contactInfo: pickFirstText(item['전화문의']),
      };
    });
}

/**
 * 3) 보건복지부 복지로 복지서비스 목록 API 연동 및 정규화
 */
async function fetchBokjiroPolicies(apiKey: string): Promise<YouthPolicy[]> {
  const encodedKey = encodeServiceKeyOnce(apiKey);
  const url = `https://apis.data.go.kr/B554287/NationalWelfareInformationsV001/NationalWelfarelistV001?serviceKey=${encodedKey}&callTp=L&pageNo=1&numOfRows=15&srchKeyCode=003&lifeArray=004`;
  const rawText = await fetchWithTimeout(url);
  const parsed = xmlParser.parse(rawText) as Record<string, unknown>;

  assertNoPublicApiBodyError(rawText, parsed);

  const wantedList = (parsed.wantedList || parsed) as Record<string, unknown>;
  const rawItems = wantedList.servList;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

  return items
    .map((item: Record<string, unknown>, idx: number): YouthPolicy | null => {
      const title = pickFirstText(item.servNm);
      if (!title) return null;
      const summary = pickFirstText(item.servDgst, title);
      const rawUrl = pickFirstText(item.servDtlLink);
      const applyUrl = isSafeHttpUrl(rawUrl) ? rawUrl : 'https://www.bokjiro.go.kr';

      return {
        id: `bokjiro-live-${pickFirstText(item.servId, idx)}`,
        title,
        source: '복지로',
        orgName: pickFirstText(item.jurMnofNm, item.jurOrgNm, '보건복지부'),
        field: mapFieldCategory(`${title} ${pickFirstText(item.intrsThemaArray)} ${summary}`),
        region: '전국',
        summary,
        target: pickFirstText(item.trgterIndvdlArray, item.lifeArray, '만 19세~34세 청년 (세부 기준 복지로 확인)'),
        supportContent: summary,
        period: pickFirstText(item.aplyMtdNm, '상시 신청'),
        deadlineIso: null,
        requiredDocs: ['사회보장급여 신청서 및 신분증', '가구 소득·재산 확인 서류 (전산 연계)'],
        applyMethod: pickFirstText(item.onapPsbltYn === 'Y' ? '복지로 온라인 및 행정복지센터 방문 신청' : '관할 행정복지센터 방문 신청'),
        applyUrl,
        contactInfo: pickFirstText(item.rprsCtadr, '보건복지상담센터 (129)'),
      };
    })
    .filter((p): p is YouthPolicy => p !== null);
}

export async function getUnifiedPolicies(forceRefresh = false): Promise<PoliciesApiResponse> {
  const nowMs = Date.now();

  if (policyCache && nowMs < policyCache.expiresAt) {
    if (!forceRefresh || nowMs - policyCache.lastRefreshTriggerAt < REFRESH_COOLDOWN_MS) {
      return policyCache.data;
    }
  }

  const youthKey = process.env.YOUTH_POLICY_API_KEY?.trim() || '';
  const publicDataKey = process.env.PUBLIC_DATA_API_KEY?.trim() || '';
  const welfareKey = process.env.WELFARE_API_KEY?.trim() || publicDataKey;

  const fallbackAll = getFallbackPolicies(new Date(nowMs));
  const sourcesChecked: PoliciesApiMeta['sourcesChecked'] = [];
  const livePolicies: YouthPolicy[] = [];

  // 1. 온통청년
  if (youthKey) {
    try {
      const items = await fetchOntongYouthPolicies(youthKey);
      livePolicies.push(...items);
      sourcesChecked.push({ source: '온통청년', status: items.length > 0 ? 'live' : 'fallback', count: items.length });
    } catch (err) {
      console.warn('[policyService] 온통청년 API fallback activated:', err instanceof Error ? err.message : err);
      sourcesChecked.push({ source: '온통청년', status: 'fallback', count: 0 });
    }
  } else {
    sourcesChecked.push({ source: '온통청년', status: 'unconfigured', count: 0 });
  }

  // 2. 보조금24
  if (publicDataKey) {
    try {
      const items = await fetchBojo24Policies(publicDataKey);
      livePolicies.push(...items);
      sourcesChecked.push({ source: '보조금24', status: items.length > 0 ? 'live' : 'fallback', count: items.length });
    } catch (err) {
      console.warn('[policyService] 보조금24 API fallback activated:', err instanceof Error ? err.message : err);
      sourcesChecked.push({ source: '보조금24', status: 'fallback', count: 0 });
    }
  } else {
    sourcesChecked.push({ source: '보조금24', status: 'unconfigured', count: 0 });
  }

  // 3. 복지로
  if (welfareKey) {
    try {
      const items = await fetchBokjiroPolicies(welfareKey);
      livePolicies.push(...items);
      sourcesChecked.push({ source: '복지로', status: items.length > 0 ? 'live' : 'fallback', count: items.length });
    } catch (err) {
      console.warn('[policyService] 복지로 API fallback activated:', err instanceof Error ? err.message : err);
      sourcesChecked.push({ source: '복지로', status: 'fallback', count: 0 });
    }
  } else {
    sourcesChecked.push({ source: '복지로', status: 'unconfigured', count: 0 });
  }

  // 중복 정책명 제거 후 병합 (실시간 API 우선 + 검증된 정적 스냅샷 보완)
  const seenTitles = new Set<string>();
  const merged: YouthPolicy[] = [];

  for (const item of [...livePolicies, ...fallbackAll]) {
    const normalizedTitle = item.title.replace(/\s+/g, '');
    if (!seenTitles.has(normalizedTitle)) {
      seenTitles.add(normalizedTitle);
      merged.push(item);
    }
  }

  const liveCount = livePolicies.length;
  const dataOrigin: PoliciesApiMeta['dataOrigin'] =
    liveCount === 0 ? 'snapshot' : liveCount >= 10 ? 'live' : 'hybrid';

  const result: PoliciesApiResponse = {
    policies: merged,
    meta: {
      totalCount: merged.length,
      dataOrigin,
      cachedAt: new Date(nowMs).toISOString(),
      ttlSeconds: CACHE_TTL_MS / 1000,
      sourcesChecked,
    },
  };

  policyCache = {
    data: result,
    expiresAt: nowMs + CACHE_TTL_MS,
    lastRefreshTriggerAt: nowMs,
  };

  return result;
}
