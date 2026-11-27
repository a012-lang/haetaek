interface PresetQuestionChipsProps {
  policyTitle?: string;
  disabled?: boolean;
  onSelectQuestion: (question: string) => void;
}

const DEFAULT_QUESTIONS = [
  '지원 자격 요건이 어떻게 되나요?',
  '필수 제출 서류 목록을 정리해 주세요.',
  '온라인 신청 절차와 주의사항을 알려주세요.',
  '신청 전 꼭 확인해야 할 마감·중복 지원 주의사항이 있나요?',
];

export function PresetQuestionChips({
  policyTitle,
  disabled = false,
  onSelectQuestion,
}: PresetQuestionChipsProps) {
  const questions = policyTitle
    ? [
        `${policyTitle} 자격 요건이 어떻게 되나요?`,
        '필수 제출 서류 목록을 정리해 주세요.',
        '신청 절차와 준비 팁을 단계별로 알려주세요.',
        '소득 기준이나 연령 제한에서 유의할 점이 있나요?',
      ]
    : DEFAULT_QUESTIONS;

  return (
    <div className="mb-3" aria-label="추천 질문 목록">
      <p className="mb-2 text-xs font-medium text-slate-500">추천 질문</p>
      <div className="flex flex-wrap gap-2">
        {questions.map((question) => (
          <button
            key={question}
            type="button"
            disabled={disabled}
            onClick={() => onSelectQuestion(question)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-left text-xs font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
