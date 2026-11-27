import { Clock, Heart, MessageSquareText } from 'lucide-react';
import { getDdayInfo } from '../lib/date';
import type { YouthPolicy } from '../types/policy';

interface PolicyCardProps {
  policy: YouthPolicy;
  isBookmarked: boolean;
  onToggleBookmark: (policyId: string) => void;
  onSelectDetail: (policy: YouthPolicy) => void;
  onAskAssistant: (policyId: string) => void;
}

export function PolicyCard({
  policy,
  isBookmarked,
  onToggleBookmark,
  onSelectDetail,
  onAskAssistant,
}: PolicyCardProps) {
  const dday = getDdayInfo(policy.deadlineIso);

  return (
    <article className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="text-blue-700">{policy.source}</span>
            <span aria-hidden="true">·</span>
            <span>{policy.field}</span>
            <span aria-hidden="true">·</span>
            <span>{policy.region}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {dday.isUrgent && (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ${
                  dday.isToday
                    ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                    : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
                }`}
              >
                <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span>{dday.label}</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => onToggleBookmark(policy.id)}
              aria-pressed={isBookmarked}
              aria-label={isBookmarked ? `${policy.title} 북마크 해제` : `${policy.title} 북마크 저장`}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
                isBookmarked
                  ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                  : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600'
              }`}
            >
              <Heart className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        <h3 className="mt-3 text-base font-semibold leading-snug text-slate-900">
          <button
            type="button"
            onClick={() => onSelectDetail(policy)}
            className="text-left hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            {policy.title}
          </button>
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {policy.summary}
        </p>

        <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-slate-500 shrink-0">지원 내용</dt>
            <dd className="truncate text-right font-medium text-slate-800">
              {policy.supportContent}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-slate-500 shrink-0">소관 기관</dt>
            <dd className="truncate text-right text-slate-700">{policy.orgName}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-slate-500 shrink-0">신청 기간</dt>
            <dd className="truncate text-right font-mono text-slate-700 tabular-nums">
              {policy.period}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-5 flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSelectDetail(policy)}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          상세보기
        </button>
        <button
          type="button"
          onClick={() => onAskAssistant(policy.id)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          <MessageSquareText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>AI 가이드</span>
        </button>
      </div>
    </article>
  );
}
