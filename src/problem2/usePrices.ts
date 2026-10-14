import { useEffect, useState } from "react";
import { normalizePrices, PRICE_URL, SAMPLE_TOKENS } from "./domain.ts";
import type { Token } from "./domain.ts";
export function usePrices() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [mode, setMode] = useState<"api" | "sample">("api");
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (mode === "sample") {
      setTokens(SAMPLE_TOKENS);
      setStatus("ready");
      setError("");
      return;
    }
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    setStatus("loading");
    setError("");
    async function load() {
      try {
        const response = await fetch(PRICE_URL, { signal: controller.signal });
        if (!response.ok)
          throw new Error(
            `The price service returned HTTP ${response.status}.`,
          );
        const next = normalizePrices(await response.json());
        if (active) {
          setTokens(next);
          setStatus("ready");
        }
      } catch (e) {
        if (active) {
          setStatus("error");
          setError(
            controller.signal.aborted
              ? "The price request timed out. Please try again."
              : e instanceof Error
                ? e.message
                : "Unable to load prices.",
          );
        }
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void load();
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [mode, attempt]);
  return {
    tokens,
    mode,
    status,
    error,
    retry: () => {
      setMode("api");
      setAttempt((n) => n + 1);
    },
    useSample: () => setMode("sample"),
  };
}
