import { Clock, ExternalLink, Heart, MessageSquareText, X } from 'lucide-react';
import { useEffect } from 'react';
import { getDdayInfo } from '../lib/date';
import { getSafeExternalHref } from '../lib/url';
import type { YouthPolicy } from '../types/policy';

interface PolicyDetailModalProps {
  policy: YouthPolicy | null;
  isBookmarked: boolean;
  onToggleBookmark: (policyId: string) => void;
  onClose: () => void;
  onAskAssistant: (policyId: string) => void;
}

export function PolicyDetailModal({
  policy,
  isBookmarked,
  onToggleBookmark,
  onClose,
  onAskAssistant,
}: PolicyDetailModalProps) {
  useEffect(() => {
    if (!policy) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [policy, onClose]);

  if (!policy) return null;

  const dday = getDdayInfo(policy.deadlineIso);
  const safeHref = getSafeExternalHref(policy.applyUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-modal-title"
    >
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px]"
        aria-hidden="true"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
              <span className="text-blue-700">{policy.source}</span>
              <span aria-hidden="true">·</span>
              <span>{policy.field}</span>
              <span aria-hidden="true">·</span>
              <span>{policy.region}</span>
              {dday.isUrgent && (
                <>
                  <span aria-hidden="true">·</span>
                  <span
                    className={`inline-flex items-center gap-1 font-semibold tabular-nums ${
                      dday.isToday ? 'text-red-700' : 'text-amber-700'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {dday.label}
                  </span>
                </>
              )}
            </div>
            <h2
              id="policy-modal-title"
              className="mt-2 text-xl font-bold tracking-tight text-slate-900"
            >
              {policy.title}
            </h2>
            <p className="mt-1 text-xs text-slate-500">{policy.orgName}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="상세 정보 닫기"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5 text-sm">
          <p className="leading-relaxed text-slate-700">{policy.summary}</p>

          <dl className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold text-slate-500">지원 내용 및 금액</dt>
              <dd className="mt-1.5 leading-relaxed text-slate-900">{policy.supportContent}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-500">신청 기간</dt>
              <dd className="mt-1.5 font-mono text-slate-900 tabular-nums">{policy.period}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold text-slate-500">지원 대상</dt>
              <dd className="mt-1.5 leading-relaxed text-slate-800">{policy.target}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold text-slate-500">신청 방법</dt>
              <dd className="mt-1.5 leading-relaxed text-slate-800">{policy.applyMethod}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold text-slate-500">주요 제출 서류</dt>
              <dd className="mt-2">
                <ul className="list-disc space-y-1 pl-5 text-slate-700">
                  {policy.requiredDocs.map((doc) => (
                    <li key={doc}>{doc}</li>
                  ))}
                </ul>
              </dd>
            </div>
            {policy.contactInfo && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold text-slate-500">문의처</dt>
                <dd className="mt-1 text-slate-800">{policy.contactInfo}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => onToggleBookmark(policy.id)}
            aria-pressed={isBookmarked}
            className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              isBookmarked
                ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Heart className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
            <span>{isBookmarked ? '관심 혜택 저장됨' : '관심 혜택 저장'}</span>
          </button>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => {
                onClose();
                onAskAssistant(policy.id);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap"
            >
              <MessageSquareText className="h-4 w-4" aria-hidden="true" />
              <span>AI 신청 가이드 받기</span>
            </button>

            <a
              href={safeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap"
            >
              <span>공식 신청 바로가기</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
