"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { cyclesApi } from "@/lib/api/endpoints";
import { useAuthSession } from "@/lib/auth/session";

const STORAGE_KEY = "pmp.active-performance-cycle";

type PerformanceCycle = {
  id: number;
  name?: string | { en?: string; ar?: string };
  performance_year?: number;
  is_active?: boolean;
  is_current?: boolean;
  active?: boolean;
  status?: string | { key?: string; label?: string };
  [key: string]: unknown;
};

type CycleOption = { value: number; label: string };

type PerformanceCycleContextValue = {
  cycleId?: number;
  activeCycle?: PerformanceCycle;
  activeCycleLabel?: string;
  options: CycleOption[];
  setCycleId: (id: number) => void;
  cycles: ReturnType<typeof useQuery<PerformanceCycle[]>>;
  isReady: boolean;
};

const PerformanceCycleContext = createContext<PerformanceCycleContextValue | null>(null);

function getCycleName(cycle: PerformanceCycle, locale: string) {
  if (typeof cycle.name === "string") return cycle.name;
  return cycle.name?.[locale as "en" | "ar"] || cycle.name?.en || cycle.name?.ar || "";
}

function isActiveCycle(cycle: PerformanceCycle) {
  const status = typeof cycle.status === "object" ? cycle.status?.key : cycle.status;
  return Boolean(cycle.is_active || cycle.is_current || cycle.active || status === "active");
}

export function PerformanceCycleProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const { isReady: sessionReady, isAuthenticated } = useAuthSession();
  const cycles = useQuery<PerformanceCycle[]>({
    queryKey: ["cycles"],
    queryFn: cyclesApi.mine,
    enabled: sessionReady && isAuthenticated,
    staleTime: 60_000,
  });
  const [cycleId, setCycleIdState] = useState<number>();
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? Number(stored) : undefined;
      if (parsed && Number.isFinite(parsed)) setCycleIdState(parsed);
    } catch {
      // Storage may be unavailable in restricted browser contexts.
    }
    setStorageReady(true);

    const syncFromStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const parsed = event.newValue ? Number(event.newValue) : undefined;
      setCycleIdState(parsed && Number.isFinite(parsed) ? parsed : undefined);
    };
    window.addEventListener("storage", syncFromStorage);
    return () => window.removeEventListener("storage", syncFromStorage);
  }, []);

  useEffect(() => {
    if (!storageReady || !cycles.data?.length) return;
    const savedCycleExists = cycleId != null && cycles.data.some((cycle) => cycle.id === cycleId);
    if (savedCycleExists) return;
    const preferredCycle = cycles.data.find(isActiveCycle) || cycles.data[0];
    if (preferredCycle) setCycleIdState(preferredCycle.id);
  }, [cycles.data, cycleId, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    try {
      if (cycleId == null) window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, String(cycleId));
    } catch {
      // Keep the in-memory selection usable when storage is unavailable.
    }
  }, [cycleId, storageReady]);

  const activeCycle = useMemo(
    () => cycles.data?.find((cycle) => cycle.id === cycleId),
    [cycles.data, cycleId],
  );
  const activeCycleLabel = activeCycle
    ? [getCycleName(activeCycle, locale), activeCycle.performance_year].filter(Boolean).join(" · ")
    : undefined;
  const options = useMemo(
    () => (cycles.data || []).map((cycle) => ({
      value: cycle.id,
      label: [getCycleName(cycle, locale), cycle.performance_year].filter(Boolean).join(" · "),
    })),
    [cycles.data, locale],
  );

  const value = useMemo<PerformanceCycleContextValue>(() => ({
    cycleId,
    activeCycle,
    activeCycleLabel,
    options,
    setCycleId: (id) => setCycleIdState(id),
    cycles,
    isReady: storageReady && !cycles.isLoading,
  }), [cycleId, activeCycle, activeCycleLabel, options, cycles, storageReady]);

  return <PerformanceCycleContext.Provider value={value}>{children}</PerformanceCycleContext.Provider>;
}

export function usePerformanceCycle() {
  const context = useContext(PerformanceCycleContext);
  if (!context) throw new Error("usePerformanceCycle must be used inside PerformanceCycleProvider");
  return context;
}
