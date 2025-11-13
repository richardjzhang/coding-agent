// Joey is the best
import { useState, useCallback } from "react";

export interface AgentRequest {
  prompt: string;
  repoUrl: string;
  githubToken?: string;
}

export interface AgentState {
  isLoading: boolean;
  result: string | null;
  error: string | null;
  thinkingLogs: string[];
}

export function useAgent() {
  const [state, setState] = useState<AgentState>({
    isLoading: false,
    result: null,
    error: null,
    thinkingLogs: [],
  });

  const executeAgent = useCallback(async (request: AgentRequest) => {
    setState({
      isLoading: true,
      result: null,
      error: null,
      thinkingLogs: [],
    });

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: request.prompt,
          repoUrl: request.repoUrl,
          githubToken: request.githubToken || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);

            if (data.type === "thinking") {
              setState((prev) => ({
                ...prev,
                thinkingLogs: [...prev.thinkingLogs, data.message],
              }));
            } else if (data.type === "result") {
              setState((prev) => ({
                ...prev,
                thinkingLogs: [...prev.thinkingLogs, data.message],
              }));
            } else if (data.type === "complete") {
              setState((prev) => ({
                ...prev,
                result: data.result.response,
                isLoading: false,
              }));
            } else if (data.type === "error") {
              setState((prev) => ({
                ...prev,
                error: data.message,
                isLoading: false,
              }));
            }
          } catch (_parseErr) {
            console.warn("Failed to parse streaming data:", line);
          }
        }
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error:
          err instanceof Error ? err.message : "An unexpected error occurred",
        isLoading: false,
      }));
    }
  }, []);

  const clearState = useCallback(() => {
    setState({
      isLoading: false,
      result: null,
      error: null,
      thinkingLogs: [],
    });
  }, []);

  return {
    ...state,
    executeAgent,
    clearState,
  };
}
