import { Bookmark, ExternalLink, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PolicyCard } from '../components/PolicyCard';
import { PolicyDetailModal } from '../components/PolicyDetailModal';
import { PolicyReportForm } from '../components/PolicyReportForm';
import { useBookmarks } from '../hooks/useBookmarks';
import { formatKoreanDate } from '../lib/date';
import { getSafeExternalHref } from '../lib/url';
import type { OfficerReportItem, YouthPolicy } from '../types/policy';

interface MyBenefitsPageProps {
  policies: YouthPolicy[];
}

export function MyBenefitsPage({ policies }: MyBenefitsPageProps) {
  const navigate = useNavigate();
  const { bookmarkedIds, isBookmarked, toggleBookmark, clearBookmarks } =
    useBookmarks();
  const [selectedPolicy, setSelectedPolicy] = useState<YouthPolicy | null>(null);
  const [reports, setReports] = useState<OfficerReportItem[]>([]);

  useEffect(() => {
    let active = true;
    fetch('/api/reports')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('load failed'))))
      .then((data: { reports?: OfficerReportItem[] }) => {
        if (active && Array.isArray(data.reports)) {
          setReports(data.reports);
        }
      })
      .catch(() => {
        // Silent fallback if reports fail to load
      });
    return () => {
      active = false;
    };
  }, []);

  const bookmarkedPolicies = useMemo(() => {
    const map = new Map(policies.map((p) => [p.id, p]));
    return bookmarkedIds
      .map((id) => map.get(id))
      .filter((p): p is YouthPolicy => Boolean(p));
  }, [policies, bookmarkedIds]);

  const handleAskAssistant = (policyId: string) => {
    navigate(`/assistant?policyId=${encodeURIComponent(policyId)}`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-14 px-4 py-10 sm:px-6 lg:px-8">
      {/* Bookmarks Section (REQ-08) */}
      <section aria-labelledby="saved-benefits-heading">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
          <div>
            <h1
              id="saved-benefits-heading"
              className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
            >
              내 관심 혜택
            </h1>
            <p className="mt-1.5 text-sm text-slate-600">
              하트 아이콘으로 저장한 혜택 목록이 브라우저에 보관되며 여러 탭에서도 실시간 동기화됩니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">
              저장됨{' '}
              <strong className="font-mono text-blue-700 tabular-nums">
                {bookmarkedPolicies.length}
              </strong>
              건
            </span>
            {bookmarkedPolicies.length > 0 && (
              <button
                type="button"
                onClick={clearBookmarks}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-red-700 whitespace-nowrap"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>전체 비우기</span>
              </button>
            )}
          </div>
        </div>

        {bookmarkedPolicies.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <Bookmark className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mt-3 text-base font-semibold text-slate-900">
              아직 저장된 관심 혜택이 없습니다.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              혜택 모아보기에서 관심 있는 정책의 하트 버튼을 눌러 비교·관리해 보세요.
            </p>
            <Link
              to="/policies"
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-800"
            >
              혜택 모아보기 이동
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {bookmarkedPolicies.map((policy) => (
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

      {/* Officer Report Form + Recent Submissions (REQ-09) */}
      <section
        aria-labelledby="officer-report-heading"
        className="grid grid-cols-1 gap-8 border-t border-slate-200 pt-10 lg:grid-cols-12"
      >
        <div className="lg:col-span-7">
          <h2 id="officer-report-heading" className="sr-only">
            담당자 공고 제보 및 수정 요청
          </h2>
          <PolicyReportForm
            onSubmitted={(newReport) =>
              setReports((prev) => [newReport, ...prev])
            }
          />
        </div>

        <aside className="lg:col-span-5">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-base font-bold text-slate-900">
              최근 접수된 기관 공고 제보
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              정책 담당자가 제출한 신규 공고 및 현행화 요청 내역입니다.
            </p>

            <ul className="mt-5 divide-y divide-slate-100">
              {reports.map((item) => (
                <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-blue-700">
                      {item.status}
                    </span>
                    <span className="font-mono text-slate-400 tabular-nums">
                      {formatKoreanDate(item.submittedAt.slice(0, 10))}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {item.policyName}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {item.orgName} · {item.officerEmail}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">
                    {item.reason}
                  </p>
                  <a
                    href={getSafeExternalHref(item.announcementUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-blue-700"
                  >
                    <span>공고 원문 확인</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
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
