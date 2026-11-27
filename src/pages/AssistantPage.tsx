import {
  Bot,
  ExternalLink,
  Search,
  Send,
  Square,
  User,
} from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PresetQuestionChips } from '../components/PresetQuestionChips';
import { getSafeExternalHref } from '../lib/url';
import type { ChatHistoryTurn, YouthPolicy } from '../types/policy';

interface AssistantPageProps {
  policies: YouthPolicy[];
  isLoadingPolicies: boolean;
}

interface UiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function AssistantPage({
  policies,
  isLoadingPolicies,
}: AssistantPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPolicyId = searchParams.get('policyId') ?? '';

  const [policySearch, setPolicySearch] = useState('');
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const selectedPolicy = useMemo(() => {
    if (!policies.length) return null;
    if (urlPolicyId) {
      return policies.find((p) => p.id === urlPolicyId) ?? policies[0];
    }
    return policies[0];
  }, [policies, urlPolicyId]);

  const filteredPolicyList = useMemo(() => {
    const q = policySearch.trim().toLowerCase();
    if (!q) return policies;
    return policies.filter((p) =>
      `${p.title} ${p.source} ${p.field} ${p.orgName}`.toLowerCase().includes(q)
    );
  }, [policies, policySearch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleSelectPolicy = (policyId: string) => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setChatError(null);
    setMessages([]);
    const next = new URLSearchParams(searchParams);
    next.set('policyId', policyId);
    setSearchParams(next, { replace: true });
  };

  const stopStreaming = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
    );
  };

  const sendMessage = async (rawMessage: string) => {
    const text = rawMessage.trim();
    if (!text || isStreaming) return;

    setChatError(null);
    setInputText('');

    const historySnapshot: ChatHistoryTurn[] = messages
      .filter((m) => !m.isStreaming && m.content.trim().length > 0)
      .map((m) => ({ role: m.role, content: m.content }));

    const userMsgId = `u-${Date.now()}`;
    const assistantMsgId = `a-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: text },
      { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true },
    ]);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsStreaming(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          policyId: selectedPolicy?.id,
          history: historySnapshot,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        let errorMsg = `AI 응답을 시작할 수 없습니다 (HTTP ${response.status})`;
        try {
          const errJson = (await response.json()) as { error?: string };
          if (errJson.error) errorMsg = errJson.error;
        } catch {
          // ignore JSON parse failure
        }
        throw new Error(errorMsg);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const event of events) {
          const line = event
            .split('\n')
            .find((l) => l.startsWith('data: '));
          if (!line) continue;

          const payload = line.slice(6).trim();
          if (payload === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(payload) as { text?: string; error?: string };
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: m.content + parsed.text }
                    : m
                )
              );
            }
          } catch (innerErr) {
            if (innerErr instanceof Error && innerErr.message !== 'Unexpected end of JSON input') {
              throw innerErr;
            }
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, isStreaming: false } : m
        )
      );
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return;
      }
      const errMessage =
        err instanceof Error
          ? err.message
          : 'AI 신청 도우미 응답 중 오류가 발생했습니다.';
      setChatError(errMessage);
      setMessages((prev) =>
        prev.filter((m) => !(m.id === assistantMsgId && m.content.trim() === ''))
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendMessage(inputText);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          AI 신청 도우미
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          선택한 정책의 지원대상·제출서류·신청기간 정보를 기반으로 정확한 신청 절차를 실시간 안내합니다.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Policy Context Selector (RAG Light Source) */}
        <aside className="space-y-4 lg:col-span-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <label htmlFor="assistant-policy-search" className="block text-xs font-semibold text-slate-700">
              상담할 정책 선택
            </label>
            <div className="relative mt-2">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="assistant-policy-search"
                type="search"
                value={policySearch}
                onChange={(e) => setPolicySearch(e.target.value)}
                placeholder="정책명 검색..."
                className="h-9 w-full rounded-lg border border-slate-300 bg-white pr-3 pl-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="mt-3 max-h-60 space-y-1 overflow-y-auto pr-1">
              {isLoadingPolicies ? (
                <div className="space-y-2 py-2">
                  <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                  <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                </div>
              ) : (
                filteredPolicyList.map((policy) => {
                  const active = selectedPolicy?.id === policy.id;
                  return (
                    <button
                      key={policy.id}
                      type="button"
                      onClick={() => handleSelectPolicy(policy.id)}
                      className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                        active
                          ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-200'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <p className="truncate text-xs font-semibold">{policy.title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {policy.source} · {policy.field} · {policy.region}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {selectedPolicy && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-blue-700">
                  적용된 공고 컨텍스트
                </span>
                <a
                  href={getSafeExternalHref(selectedPolicy.applyUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"
                >
                  <span>원문</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
              <h2 className="mt-2 text-base font-bold text-slate-900">
                {selectedPolicy.title}
              </h2>
              <p className="mt-1 text-xs text-slate-500">{selectedPolicy.orgName}</p>

              <dl className="mt-4 space-y-3 border-t border-slate-100 pt-3 text-xs">
                <div>
                  <dt className="font-semibold text-slate-600">지원 대상</dt>
                  <dd className="mt-0.5 leading-relaxed text-slate-700">
                    {selectedPolicy.target}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-600">신청 기간</dt>
                  <dd className="mt-0.5 font-mono text-slate-700 tabular-nums">
                    {selectedPolicy.period}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-600">주요 제출서류</dt>
                  <dd className="mt-1 space-y-1 text-slate-700">
                    {selectedPolicy.requiredDocs.map((doc) => (
                      <p key={doc}>• {doc}</p>
                    ))}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </aside>

        {/* Right: SSE Streaming Chat Panel */}
        <section
          aria-label="AI 신청 가이드 대화창"
          className="flex h-[680px] flex-col rounded-xl border border-slate-200 bg-white lg:col-span-8"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <Bot className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedPolicy ? selectedPolicy.title : '청년 정책 일반 상담'}
                </p>
                <p className="text-xs text-slate-500">
                  공식 메타데이터 기반 신청 안내
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Bot className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">
                  {selectedPolicy
                    ? `${selectedPolicy.title} 신청 방법을 안내해 드립니다`
                    : '궁금한 청년 정책을 선택하거나 질문해 주세요'}
                </h3>
                <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-500">
                  아래 추천 질문을 클릭하거나 자격 조건, 필요 서류, 온라인 접수 순서를 직접 입력해 보세요.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-blue-700">
                      <Bot className="h-4 w-4" aria-hidden="true" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-blue-700 text-white'
                        : 'border border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                  >
                    {msg.content || (msg.isStreaming ? '안내 내용을 정리하고 있습니다...' : '')}
                  </div>

                  {msg.role === 'user' && (
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
                      <User className="h-4 w-4" aria-hidden="true" />
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {chatError && (
            <div
              role="alert"
              className="mx-5 mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-800"
            >
              {chatError}
            </div>
          )}

          <div className="border-t border-slate-200 bg-white p-4">
            {/* REQ-07: 입력창 상단 추천 질문 칩 */}
            <PresetQuestionChips
              policyTitle={selectedPolicy?.title}
              disabled={isStreaming}
              onSelectQuestion={(q) => void sendMessage(q)}
            />

            <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isStreaming}
                placeholder="신청 조건, 제출 서류, 접수 방법 등을 질문해 주세요..."
                aria-label="AI 신청 도우미 질문 입력"
                className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:bg-slate-50"
              />

              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopStreaming}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-4 text-xs font-semibold text-white hover:bg-slate-900 whitespace-nowrap shrink-0"
                >
                  <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  <span>중단</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-blue-700 px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>전송</span>
                </button>
              )}
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
