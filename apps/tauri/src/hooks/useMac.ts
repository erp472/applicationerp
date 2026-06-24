import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

const MAC_INTERVAL_MS = 30_000;

export function useMac() {
  const [mac, setMac] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchMac() {
    try {
      const result = await invoke<string>('get_mac');
      setMac(result);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }

  useEffect(() => {
    fetchMac();
    timer.current = setInterval(fetchMac, MAC_INTERVAL_MS);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  return { mac, error };
}
