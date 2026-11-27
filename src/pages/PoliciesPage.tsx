import { RotateCcw, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PolicyCard } from '../components/PolicyCard';
import { PolicyDetailModal } from '../components/PolicyDetailModal';
import { useBookmarks } from '../hooks/useBookmarks';
import { useDebounce } from '../hooks/useDebounce';
import { getDdayInfo } from '../lib/date';
import type {
  PoliciesApiMeta,
  PolicyField,
  PolicyRegion,
  PolicySource,
  YouthPolicy,
} from '../types/policy';

interface PoliciesPageProps {
  policies: YouthPolicy[];
  meta: PoliciesApiMeta | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const SOURCE_OPTIONS: Array<'전체' | PolicySource> = [
  '전체',
  '온통청년',
  '보조금24',
  '정부24',
  '복지로',
];

const FIELD_OPTIONS: Array<'전체' | PolicyField> = [
  '전체',
  '일자리',
  '주거',
  '금융·자산',
  '교육',
  '복지·건강',
  '창업',
];

const REGION_OPTIONS: Array<'전체' | PolicyRegion> = [
  '전체',
  '전국',
  '서울',
  '경기',
  '인천',
  '부산',
  '대전',
  '대구',
  '광주',
  '기타 지역',
];

type SortOption = 'urgent' | 'default' | 'title';

export function PoliciesPage({
  policies,
  meta,
  isLoading,
  error,
  onRefresh,
}: PoliciesPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const urlKeyword = searchParams.get('keyword') ?? '';
  const urlSource = (searchParams.get('source') ?? '전체') as '전체' | PolicySource;
  const urlField = (searchParams.get('field') ?? '전체') as '전체' | PolicyField;
  const urlRegion = (searchParams.get('region') ?? '전체') as '전체' | PolicyRegion;

  const [keywordInput, setKeywordInput] = useState(urlKeyword);
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('urgent');
  const [selectedPolicy, setSelectedPolicy] = useState<YouthPolicy | null>(null);

  // REQ-04: 300ms 디바운스
  const debouncedKeyword = useDebounce(keywordInput, 300);
  const lastWrittenKeywordRef = useRef(urlKeyword);

  useEffect(() => {
    if (urlKeyword !== lastWrittenKeywordRef.current) {
      lastWrittenKeywordRef.current = urlKeyword;
      setKeywordInput(urlKeyword);
    }
  }, [urlKeyword]);

  const updateQueryParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === '전체') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  const handleKeywordChange = (val: string) => {
    setKeywordInput(val);
    const trimmed = val.trim();
    lastWrittenKeywordRef.current = trimmed;
    updateQueryParam('keyword', trimmed);
  };

  const handleResetFilters = () => {
    lastWrittenKeywordRef.current = '';
    setKeywordInput('');
    setOnlyUrgent(false);
    setSortBy('urgent');
    setSearchParams({}, { replace: true });
  };

  // REQ-04: useEffect 내 state 재저장 금지 — useMemo 기반 파생 상태(Derived State)만 사용
  const filteredPolicies = useMemo(() => {
    const q = debouncedKeyword.trim().toLowerCase();

    const matched = policies.filter((policy) => {
      if (urlSource !== '전체' && policy.source !== urlSource) return false;
      if (urlField !== '전체' && policy.field !== urlField) return false;
      if (urlRegion !== '전체' && policy.region !== urlRegion) return false;

      if (onlyUrgent && !getDdayInfo(policy.deadlineIso).isUrgent) {
        return false;
      }

      if (q) {
        const searchable = [
          policy.title,
          policy.summary,
          policy.orgName,
          policy.target,
          policy.supportContent,
          policy.field,
          policy.region,
          policy.source,
        ]
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      return true;
    });

    if (sortBy === 'title') {
      return [...matched].sort((a, b) => a.title.localeCompare(b.title, 'ko'));
    }

    if (sortBy === 'urgent') {
      return [...matched].sort((a, b) => {
        const da = getDdayInfo(a.deadlineIso);
        const db = getDdayInfo(b.deadlineIso);
        const scoreA =
          da.daysRemaining !== null && !da.isExpired ? da.daysRemaining : 9999;
        const scoreB =
          db.daysRemaining !== null && !db.isExpired ? db.daysRemaining : 9999;
        return scoreA - scoreB;
      });
    }

    return matched;
  }, [policies, debouncedKeyword, urlSource, urlField, urlRegion, onlyUrgent, sortBy]);

  const handleAskAssistant = (policyId: string) => {
    navigate(`/assistant?policyId=${encodeURIComponent(policyId)}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            청년 혜택 모아보기
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            온통청년·보조금24·정부24·복지로 공고를 출처, 분야, 지역 조건으로 즉시 필터링합니다.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          {meta && (
            <span>
              기준 데이터:{' '}
              {meta.dataOrigin === 'live'
                ? '공공 API 실시간'
                : meta.dataOrigin === 'hybrid'
                  ? '실시간 + 통합 스냅샷'
                  : '통합 검증 스냅샷'}
            </span>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>새로고침</span>
          </button>
        </div>
      </div>

      {/* Multi-condition Filter Bar */}
      <section
        aria-label="혜택 필터 조건"
        className="mt-6 rounded-xl border border-slate-200 bg-white p-5"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-5">
            <label htmlFor="policy-keyword" className="block text-xs font-semibold text-slate-600">
              키워드 검색
            </label>
            <div className="relative mt-1.5">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="policy-keyword"
                type="search"
                value={keywordInput}
                onChange={(e) => handleKeywordChange(e.target.value)}
                placeholder="정책명, 지원내용, 기관명 입력..."
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="filter-source" className="block text-xs font-semibold text-slate-600">
              출처 포털
            </label>
            <select
              id="filter-source"
              value={urlSource}
              onChange={(e) => updateQueryParam('source', e.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="filter-field" className="block text-xs font-semibold text-slate-600">
              지원 분야
            </label>
            <select
              id="filter-field"
              value={urlField}
              onChange={(e) => updateQueryParam('field', e.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              {FIELD_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="filter-region" className="block text-xs font-semibold text-slate-600">
              대상 지역
            </label>
            <select
              id="filter-region"
              value={urlRegion}
              onChange={(e) => updateQueryParam('region', e.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              {REGION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-slate-700">
              검색 결과{' '}
              <span className="font-mono font-bold text-blue-700 tabular-nums">
                {filteredPolicies.length}
              </span>
              건
            </p>

            <button
              type="button"
              onClick={() => setOnlyUrgent((prev) => !prev)}
              aria-pressed={onlyUrgent}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                onlyUrgent
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              마감 임박(7일 이내)만 보기
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="sort-order" className="text-xs font-medium text-slate-500">
              정렬
            </label>
            <select
              id="sort-order"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-none"
            >
              <option value="urgent">마감 임박순</option>
              <option value="default">기본 등록순</option>
              <option value="title">정책명 가나다순</option>
            </select>

            <button
              type="button"
              onClick={handleResetFilters}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 whitespace-nowrap"
            >
              초기화
            </button>
          </div>
        </div>
      </section>

      {/* Results Area */}
      <section className="mt-8" aria-label="혜택 검색 결과">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-medium text-red-800">{error}</p>
            <button
              type="button"
              onClick={onRefresh}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800"
            >
              다시 불러오기
            </button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white p-5"
              />
            ))}
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
            <p className="text-base font-semibold text-slate-900">
              조건에 일치하는 청년 혜택이 없습니다.
            </p>
            <p className="mt-1.5 text-sm text-slate-500">
              검색어나 출처·지역 필터 조건을 완화해 다시 조회해 보세요.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-800"
            >
              필터 전체 초기화
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredPolicies.map((policy) => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                isBookmarked={isBookmarked(policy.id)}
                onToggleBookmark={toggleBookmark}
                onSelectDetail={setSelectedPolicy}
                onAskAssistant={handleAskAssistant}
              />
            ))}
          </div>
        )}
      </section>

      <PolicyDetailModal
        policy={selectedPolicy}
        isBookmarked={selectedPolicy ? isBookmarked(selectedPolicy.id) : false}
        onToggleBookmark={toggleBookmark}
        onClose={() => setSelectedPolicy(null)}
        onAskAssistant={handleAskAssistant}
      />
    </div>
  );
}
