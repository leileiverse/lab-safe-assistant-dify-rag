import { useCallback, useState } from 'react';
import { jsonFetch } from './useApi';
import type {
  DrillScenariosResponse,
  DrillScenarioDetail,
  DrillSubmitResponse,
} from '../types/drill';

export function useDrillScenarios() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DrillScenariosResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await jsonFetch<DrillScenariosResponse>('/api/drill/scenarios');
      setData(result);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : '加载失败';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { load, loading, error, data };
}

export function useDrillDetail() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (scenarioId: string): Promise<DrillScenarioDetail> => {
    setLoading(true);
    setError(null);
    try {
      return await jsonFetch<DrillScenarioDetail>(`/api/drill/scenarios/${scenarioId}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '加载失败';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { load, loading, error };
}

export function useDrillSubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (scenarioId: string, optionId: string): Promise<DrillSubmitResponse> => {
      setLoading(true);
      setError(null);
      try {
        return await jsonFetch<DrillSubmitResponse>('/api/drill/submit', {
          method: 'POST',
          body: JSON.stringify({ scenario_id: scenarioId, option_id: optionId }),
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : '提交失败';
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { submit, loading, error };
}
