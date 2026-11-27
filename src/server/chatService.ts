import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type { ChatHistoryTurn, YouthPolicy } from '../types/policy.ts';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY가 서버 환경에 설정되어 있지 않습니다. Settings > Secrets 패널을 확인해주세요.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * RAG Light 패턴:
 * 선택된 청년 정책의 구조화된 메타데이터(지원대상, 제출서류, 신청기관, 기간 등)를
 * 시스템 프롬프트에 동적 삽입해 컨텍스트 밖 환각을 방지합니다.
 */
export function buildPolicySystemInstruction(policy: YouthPolicy | null): string {
  if (!policy) {
    return [
      '당신은 대한민국 청년 정책 통합 플랫폼 "청년모아"의 AI 신청 도우미입니다.',
      '사용자가 아직 특정 정책을 선택하지 않았습니다.',
      '온통청년, 정부24, 보조금24, 복지로의 일반적인 청년 정책 신청 절차(본인인증, 소득·재산 확인, 서류 발급 등)를 정확하고 친절한 한국어로 안내하되, 특정 금액이나 마감일 등 확인되지 않은 세부 수치는 추측하지 마세요.',
      '정확한 개별 자격 심사는 좌측 목록에서 정책을 선택하거나 공식 포털을 확인하도록 안내하세요.',
    ].join('\n');
  }

  return [
    '당신은 대한민국 청년 정책 통합 플랫폼 "청년모아"의 AI 신청 가이드입니다.',
    '아래 제공된 공식 정책 메타데이터(컨텍스트)만을 근거로 사용자의 질문에 정확하고 실행 가능한 안내를 제공하세요.',
    '',
    '### 엄수 규칙 (환각 방지)',
    '1. 아래 [선택된 정책 컨텍스트]에 없는 소득 금액, 나이 예외, 추가 제출서류, 마감 시간을 절대 임의로 만들어내지 마세요.',
    '2. 컨텍스트에 명시되지 않은 세부 조건을 묻는 경우, "제공된 공고 요약에는 해당 세부 기준이 명시되어 있지 않습니다"라고 분명히 알리고, 아래 공식 신청 URL 또는 문의처로 확인하도록 안내하세요.',
    '3. 답변은 한국어로 간결한 불릿 리스트와 단계별 체크리스트 형태로 정리하세요.',
    '',
    '### [선택된 정책 컨텍스트]',
    `- 정책명: ${policy.title}`,
    `- 출처 포털: ${policy.source}`,
    `- 소관 기관: ${policy.orgName}`,
    `- 지원 분야: ${policy.field} / 대상 지역: ${policy.region}`,
    `- 정책 요약: ${policy.summary}`,
    `- 지원 대상: ${policy.target}`,
    `- 지원 내용 및 금액: ${policy.supportContent}`,
    `- 신청 기간: ${policy.period}`,
    `- 필수 제출서류: ${policy.requiredDocs.join(', ')}`,
    `- 신청 방법: ${policy.applyMethod}`,
    `- 공식 신청 URL: ${policy.applyUrl}`,
    policy.contactInfo ? `- 문의처: ${policy.contactInfo}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export async function* streamPolicyChatResponse(params: {
  message: string;
  policy: YouthPolicy | null;
  history: ChatHistoryTurn[];
}): AsyncGenerator<string, void, unknown> {
  const ai = getGeminiClient();
  const systemInstruction = buildPolicySystemInstruction(params.policy);

  const recentHistory = params.history.slice(-8).map((turn) => ({
    role: turn.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: turn.content }],
  }));

  const contents = [
    ...recentHistory,
    {
      role: 'user',
      parts: [{ text: params.message }],
    },
  ];

  const stream = await ai.models.generateContentStream({
    model: 'gemini-4-hydrogen',
    contents,
    config: {
      systemInstruction,
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.LOW,
      },
    },
  });

  for await (const chunk of stream) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}
