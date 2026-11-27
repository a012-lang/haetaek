import { ArrowRight, Building2, Search } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PolicyCard } from '../components/PolicyCard';
import { PolicyDetailModal } from '../components/PolicyDetailModal';
import { useBookmarks } from '../hooks/useBookmarks';
import { getDdayInfo } from '../lib/date';
import type { PolicyField, PolicySource, YouthPolicy } from '../types/policy';

interface HomePageProps {
  policies: YouthPolicy[];
  isLoading: boolean;
}

const QUICK_FIELDS: PolicyField[] = [
  '주거',
  '일자리',
  '금융·자산',
  '교육',
  '복지·건강',
  '창업',
];

const SOURCE_OVERVIEW: {
  number: string;
  source: PolicySource;
  org: string;
  description: string;
}[] = [
  {
    number: '01',
    source: '온통청년',
    org: '한국고용정보원 · 국무조정실',
    description: '중앙부처 및 지자체별 청년 일자리, 주거, 창업, 교육 지원 정책을 통합 제공합니다.',
  },
  {
    number: '02',
    source: '보조금24',
    org: '행정안전부',
    description: '정부와 지자체가 제공하는 현금성 수당, 교통비 환급, 계좌 매칭 혜택을 모았습니다.',
  },
  {
    number: '03',
    source: '정부24',
    org: '행정안전부 · 각 부처',
    description: '전세보증금 반환보증 보증료 지원, 학자금 대출 등 대국민 공공서비스 신청을 연계합니다.',
  },
  {
    number: '04',
    source: '복지로',
    org: '보건복지부',
    description: '청년내일저축계좌, 마음건강 심리상담 바우처, 가족돌봄청년 등 복지 급여를 안내합니다.',
  },
];

export function HomePage({ policies, isLoading }: HomePageProps) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<YouthPolicy | null>(null);
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const urgentPolicies = useMemo(() => {
    return policies
      .map((policy) => ({ policy, dday: getDdayInfo(policy.deadlineIso) }))
      .filter((item) => item.dday.isUrgent)
      .sort(
        (a, b) =>
          (a.dday.daysRemaining ?? 999) - (b.dday.daysRemaining ?? 999)
      )
      .slice(0, 6);
  }, [policies]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (trimmed) {
      navigate(`/policies?keyword=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/policies');
    }
  };

  const handleAskAssistant = (policyId: string) => {
    navigate(`/assistant?policyId=${encodeURIComponent(policyId)}`);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Split */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
            <div className="flex flex-col justify-between lg:col-span-7">
              <div>
                <p className="text-xs font-semibold tracking-wide text-blue-700">
                  온통청년 · 정부24 · 보조금24 · 복지로 통합 조회
                </p>
                <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem]">
                  흩어진 청년 혜택,
                  <br />
                  한 번에 찾고 바로 신청하세요
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
                  정부24, 보조금24, 복지로, 온통청년 포털을 일일이 돌아다닐 필요 없이
                  나에게 맞는 지원금과 주거·취업 혜택을 한곳에서 필터링하고, AI 신청
                  도우미에게 자격 요건과 제출 서류까지 바로 안내받을 수 있습니다.
                </p>

                <form
                  onSubmit={handleSearchSubmit}
                  role="search"
                  aria-label="청년 혜택 통합 검색"
                  className="mt-7 flex flex-col gap-2.5 sm:flex-row"
                >
                  <div className="relative flex-1">
                    <Search
                      className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="월세 지원, K-패스, 청년도약계좌, 구직촉진수당 등 검색"
                      aria-label="혜택 키워드 입력"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                  >
                    혜택 검색
                  </button>
                </form>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-xs font-medium text-slate-500">
                    분야별 바로가기
                  </span>
                  {QUICK_FIELDS.map((field) => (
                    <Link
                      key={field}
                      to={`/policies?field=${encodeURIComponent(field)}`}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 whitespace-nowrap"
                    >
                      {field}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative h-64 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 sm:h-80 lg:h-full lg:min-h-[340px]">
                {!heroImgFailed ? (
                  <img
                    src="/src/assets/images/hero_youth_hub_1795763276853.jpg"
                    alt="청년들이 밝은 공공 청년센터 라운지에서 정책 자료와 노트북을 함께 살펴보는 모습"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 p-6 text-center">
                    <Building2 className="h-10 w-10 text-blue-700" aria-hidden="true" />
                    <p className="mt-3 text-sm font-semibold text-slate-800">
                      청년 정책 통합 플랫폼 청년모아
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4-column summary strip below hero split */}
          <div className="mt-10 grid grid-cols-2 gap-4 border-t border-slate-200 pt-8 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-5 py-4">
              <p className="text-xs font-medium text-slate-500">통합 조회 가능 혜택</p>
              <p className="mt-1.5 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {isLoading ? '...' : `${policies.length}건`}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-5 py-4">
              <p className="text-xs font-medium text-slate-500">연계 공공 포털</p>
              <p className="mt-1.5 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                4개 기관
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-5 py-4">
              <p className="text-xs font-medium text-slate-500">7일 이내 마감 임박</p>
              <p className="mt-1.5 font-mono text-2xl font-bold text-amber-700 tabular-nums">
                {isLoading ? '...' : `${urgentPolicies.length}건`}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-5 py-4">
              <p className="text-xs font-medium text-slate-500">신청 안내 지원</p>
              <p className="mt-1.5 text-lg font-bold text-blue-700">
                AI 신청 가이드
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Urgent Deadlines Section (REQ-10) */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              마감 임박 청년 혜택
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              UTC 자정 기준으로 접수 마감일이 7일 이내로 남은 공고를 우선 안내합니다.
            </p>
          </div>
          <Link
            to="/policies"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap"
          >
            <span>전체 혜택 보기</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white p-5"
              />
            ))}
          </div>
        ) : urgentPolicies.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {urgentPolicies.map(({ policy }) => (
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
        ) : (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
            현재 7일 이내에 마감되는 공고가 없습니다. 전체 혜택 목록에서 상시 신청 정책을 확인해 보세요.
          </div>
        )}
      </section>

      {/* Portal Integration Overview & AI Assistant Callout */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              4개 공공 포털을 한 화면에
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              청년 정책은 부처와 지자체마다 올라오는 사이트가 달라 놓치기 쉽습니다.
              청년모아는 공공데이터 API를 서버에서 안전하게 통합해 중복 없이 보여드리며,
              신청 방법이 막막한 정책은 AI 도우미가 공고 기준으로 단계별 안내해 드립니다.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/assistant"
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap"
              >
                AI 신청 도우미 열기
              </Link>
              <Link
                to="/my-benefits"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
              >
                담당자 공고 제보
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
            {SOURCE_OVERVIEW.map((item) => (
              <Link
                key={item.source}
                to={`/policies?source=${encodeURIComponent(item.source)}`}
                className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-5 transition-colors hover:border-blue-300 hover:bg-blue-50/30"
              >
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-blue-700 tabular-nums">
                      {item.number}.
                    </span>
                    <span className="text-xs text-slate-500">{item.org}</span>
                  </div>
                  <h3 className="mt-2 text-base font-bold text-slate-900 group-hover:text-blue-700">
                    {item.source}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                    {item.description}
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-700 group-hover:text-blue-700">
                  <span>{item.source} 공고 보기</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
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
