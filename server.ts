import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { policyReportSchema } from './src/schemas/reportSchema.ts';
import { streamPolicyChatResponse } from './src/server/chatService.ts';
import { getUnifiedPolicies } from './src/server/policyService.ts';
import type { OfficerReportItem, YouthPolicy } from './src/types/policy.ts';

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// 담당자 제보 및 수정 요청 인메모리 저장소 (초기 실사례 레코드 포함)
const officerReports: OfficerReportItem[] = [
  {
    id: 'rep-seed-001',
    orgName: '서울특별시 미래청년기획관',
    officerEmail: 'youth_policy@seoul.go.kr',
    policyName: '서울시 청년수당 (미취업 청년 활동지원)',
    announcementUrl: 'https://youth.seoul.go.kr',
    reason: '하반기 추가 모집 접수 마감일 및 단기근로자 증빙서류 안내 문구를 최신 공고 기준으로 현행화 요청합니다.',
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: '접수 완료',
  },
  {
    id: 'rep-seed-002',
    orgName: '국토교통부 청년주거정책과',
    officerEmail: 'housing_support@korea.kr',
    policyName: '청년월세 한시 특별지원 (2차)',
    announcementUrl: 'https://www.bokjiro.go.kr',
    reason: '청약통장 가입 요건 안내 및 복지로 온라인 접수 링크 최신화 확인 요청드립니다.',
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: '검토 중',
  },
];

const chatRequestSchema = z.object({
  message: z.string().trim().min(1, '질문 내용을 입력해주세요.').max(1500),
  policyId: z.string().trim().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(4000),
      })
    )
    .max(16)
    .optional()
    .default([]),
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // 1. 공공데이터 통합 프록시 API (/api/policies)
  app.get('/api/policies', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === '1';
      const data = await getUnifiedPolicies(forceRefresh);
      res.json(data);
    } catch (err) {
      console.error('[/api/policies] error:', err);
      res.status(500).json({
        error: '정책 데이터를 불러오는 중 오류가 발생했습니다.',
      });
    }
  });

  // 2. AI 신청 가이드 SSE 스트리밍 API (/api/chat)
  app.post('/api/chat', async (req, res) => {
    const parsed = chatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || '잘못된 요청 형식입니다.',
      });
      return;
    }

    const { message, policyId, history } = parsed.data;

    let selectedPolicy: YouthPolicy | null = null;
    if (policyId) {
      const { policies } = await getUnifiedPolicies(false);
      selectedPolicy = policies.find((p) => p.id === policyId) ?? null;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      for await (const textChunk of streamPolicyChatResponse({
        message,
        policy: selectedPolicy,
        history,
      })) {
        if (res.writableEnded) break;
        res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
      }
      if (!res.writableEnded) {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    } catch (err) {
      const rawMsg =
        err instanceof Error
          ? err.message
          : 'AI 응답 생성 중 문제가 발생했습니다.';
      let userFriendlyError = rawMsg;
      if (rawMsg.includes('PERMISSION_DENIED') || rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('403') || rawMsg.includes('400')) {
        userFriendlyError =
          'Gemini API 키가 설정되지 않았거나 현재 프로젝트에서 무료 등급 사용이 제한되어 있습니다. Settings > Secrets 패널에서 유효한 API 키를 확인해 주세요.';
      } else if (rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('429')) {
        userFriendlyError =
          'AI 요청 한도를 초과했습니다. 잠시 후 다시 시도하거나 Settings > Secrets 패널에서 API 키 할당량을 확인해 주세요.';
      }
      console.error('[/api/chat] Gemini streaming error:', err);
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: userFriendlyError })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    }
  });

  // 3. 담당자 공고 제보 조회 및 등록 (/api/reports)
  app.get('/api/reports', (_req, res) => {
    res.json({ reports: officerReports });
  });

  app.post('/api/reports', (req, res) => {
    const parsed = policyReportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || '입력값을 확인해주세요.',
        issues: parsed.error.issues,
      });
      return;
    }

    const newItem: OfficerReportItem = {
      id: `rep-${Date.now().toString(36)}`,
      ...parsed.data,
      submittedAt: new Date().toISOString(),
      status: '접수 완료',
    };

    officerReports.unshift(newItem);
    res.status(201).json({ report: newItem });
  });

  // Vite dev middleware 또는 production static build 서빙
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.use('/{*splat}', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
