export type PolicySource = '온통청년' | '보조금24' | '정부24' | '복지로';

export type PolicyField =
  | '일자리'
  | '주거'
  | '금융·자산'
  | '교육'
  | '복지·건강'
  | '창업';

export type PolicyRegion =
  | '전국'
  | '서울'
  | '경기'
  | '인천'
  | '부산'
  | '대구'
  | '대전'
  | '광주'
  | '기타 지역';

export interface YouthPolicy {
  id: string;
  title: string;
  source: PolicySource;
  orgName: string;
  field: PolicyField;
  region: PolicyRegion;
  summary: string;
  target: string;
  supportContent: string;
  period: string;
  /**
   * YYYY-MM-DD (UTC date string) or null when 상시 신청
   */
  deadlineIso: string | null;
  requiredDocs: string[];
  applyMethod: string;
  applyUrl: string;
  contactInfo?: string;
}

export interface PoliciesApiMeta {
  totalCount: number;
  dataOrigin: 'live' | 'hybrid' | 'snapshot';
  cachedAt: string;
  ttlSeconds: number;
  sourcesChecked: {
    source: PolicySource;
    status: 'live' | 'fallback' | 'unconfigured';
    count: number;
  }[];
}

export interface PoliciesApiResponse {
  policies: YouthPolicy[];
  meta: PoliciesApiMeta;
}

export interface OfficerReportItem {
  id: string;
  orgName: string;
  officerEmail: string;
  policyName: string;
  announcementUrl: string;
  reason: string;
  submittedAt: string;
  status: '접수 완료' | '검토 중';
}

export interface ChatHistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}
