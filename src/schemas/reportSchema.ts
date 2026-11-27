import { z } from 'zod';

export const policyReportSchema = z.object({
  orgName: z
    .string()
    .trim()
    .min(2, '기관명을 2자 이상 입력해주세요.'),
  officerEmail: z
    .string()
    .trim()
    .email('올바른 이메일 형식이 아닙니다 (예: name@korea.kr).'),
  policyName: z
    .string()
    .trim()
    .min(2, '정책명을 입력해주세요.'),
  announcementUrl: z
    .string()
    .trim()
    .url("'https://'로 시작하는 유효한 공고 URL을 입력해주세요.")
    .refine(
      (val) => val.startsWith('https://'),
      "'https://'로 시작하는 유효한 공고 URL을 입력해주세요."
    ),
  reason: z
    .string()
    .trim()
    .min(10, '제보 및 수정 사유를 10자 이상 500자 이내로 작성해주세요.')
    .max(500, '제보 및 수정 사유를 10자 이상 500자 이내로 작성해주세요.'),
});

export type PolicyReportFormValues = z.infer<typeof policyReportSchema>;
