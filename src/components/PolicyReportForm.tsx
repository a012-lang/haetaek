import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Send } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  policyReportSchema,
  type PolicyReportFormValues,
} from '../schemas/reportSchema';
import type { OfficerReportItem } from '../types/policy';

interface PolicyReportFormProps {
  onSubmitted?: (report: OfficerReportItem) => void;
}

export function PolicyReportForm({ onSubmitted }: PolicyReportFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedReceipt, setSubmittedReceipt] = useState<OfficerReportItem | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PolicyReportFormValues>({
    resolver: zodResolver(policyReportSchema),
    mode: 'onBlur',
    defaultValues: {
      orgName: '',
      officerEmail: '',
      policyName: '',
      announcementUrl: '',
      reason: '',
    },
  });

  const reasonLength = watch('reason')?.length ?? 0;

  const onSubmit = async (values: PolicyReportFormValues) => {
    setSubmitError(null);
    setSubmittedReceipt(null);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = (await res.json()) as {
        report?: OfficerReportItem;
        error?: string;
      };

      if (!res.ok || !data.report) {
        throw new Error(data.error || '제보 접수 중 오류가 발생했습니다.');
      }

      setSubmittedReceipt(data.report);
      onSubmitted?.(data.report);
      reset();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : '네트워크 오류로 제보를 전송하지 못했습니다.'
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-6"
    >
      <div>
        <h3 className="text-lg font-bold text-slate-900">
          담당자 공고 제보 및 수정 요청
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          지자체·공공기관 정책 담당자께서 신규 공고 등록이나 마감일·지원내용 수정을 요청할 수 있습니다.
        </p>
      </div>

      {submittedReceipt && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
          <div>
            <p className="font-semibold">공고 제보가 정상적으로 접수되었습니다.</p>
            <p className="mt-1 text-xs text-emerald-800">
              정책명: {submittedReceipt.policyName} · 담당 기관: {submittedReceipt.orgName}
            </p>
          </div>
        </div>
      )}

      {submitError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800"
        >
          {submitError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="orgName" className="block text-xs font-semibold text-slate-700">
            소속 기관명 <span className="text-red-600">*</span>
          </label>
          <input
            id="orgName"
            type="text"
            placeholder="예: 서울특별시 청년정책담당관"
            aria-invalid={Boolean(errors.orgName)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            {...register('orgName')}
          />
          {errors.orgName && (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              {errors.orgName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="officerEmail" className="block text-xs font-semibold text-slate-700">
            담당자 공식 이메일 <span className="text-red-600">*</span>
          </label>
          <input
            id="officerEmail"
            type="email"
            placeholder="name@korea.kr"
            aria-invalid={Boolean(errors.officerEmail)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            {...register('officerEmail')}
          />
          {errors.officerEmail && (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              {errors.officerEmail.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="policyName" className="block text-xs font-semibold text-slate-700">
          정책명 <span className="text-red-600">*</span>
        </label>
        <input
          id="policyName"
          type="text"
          placeholder="예: 2026년 청년 월세 특별지원 추가 모집"
          aria-invalid={Boolean(errors.policyName)}
          className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          {...register('policyName')}
        />
        {errors.policyName && (
          <p className="mt-1.5 text-xs font-medium text-red-600">
            {errors.policyName.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="announcementUrl" className="block text-xs font-semibold text-slate-700">
          공고 원문 URL <span className="text-red-600">*</span>
        </label>
        <input
          id="announcementUrl"
          type="url"
          placeholder="https://www.gov.kr/..."
          aria-invalid={Boolean(errors.announcementUrl)}
          className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          {...register('announcementUrl')}
        />
        {errors.announcementUrl && (
          <p className="mt-1.5 text-xs font-medium text-red-600">
            {errors.announcementUrl.message}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="reason" className="block text-xs font-semibold text-slate-700">
            제보 및 수정 사유 <span className="text-red-600">*</span>
          </label>
          <span className="font-mono text-xs text-slate-500 tabular-nums">
            {reasonLength} / 500
          </span>
        </div>
        <textarea
          id="reason"
          rows={4}
          placeholder="신규 공고 개요, 변경된 신청 기간 또는 수정이 필요한 항목을 10자 이상 작성해주세요."
          aria-invalid={Boolean(errors.reason)}
          className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          {...register('reason')}
        />
        {errors.reason && (
          <p className="mt-1.5 text-xs font-medium text-red-600">
            {errors.reason.message}
          </p>
        )}
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          <span>{isSubmitting ? '접수 처리 중...' : '공고 제보 제출하기'}</span>
        </button>
      </div>
    </form>
  );
}
