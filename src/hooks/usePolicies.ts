import { useCallback, useEffect, useState } from 'react';
import type { PoliciesApiMeta, PoliciesApiResponse, YouthPolicy } from '../types/policy';

interface UsePoliciesState {
  policies: YouthPolicy[];
  meta: PoliciesApiMeta | null;
  isLoading: boolean;
  error: string | null;
}

export function usePolicies() {
  const [state, setState] = useState<UsePoliciesState>({
    policies: [],
    meta: null,
    isLoading: true,
    error: null,
  });

  const fetchPolicies = useCallback(async (forceRefresh = false) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const endpoint = forceRefresh ? '/api/policies?refresh=1' : '/api/policies';
      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error(`정책 정보를 불러오지 못했습니다 (HTTP ${res.status})`);
      }
      const data = (await res.json()) as PoliciesApiResponse;
      setState({
        policies: data.policies ?? [],
        meta: data.meta ?? null,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          err instanceof Error
            ? err.message
            : '정책 데이터를 불러오는 중 오류가 발생했습니다.',
      }));
    }
  }, []);

  useEffect(() => {
    void fetchPolicies(false);
  }, [fetchPolicies]);

  return {
    ...state,
    refetch: () => fetchPolicies(true),
  };
}
