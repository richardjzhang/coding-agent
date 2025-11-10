"use client";

import { Sparkles } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { ErrorDisplay } from "@/components/ErrorDisplay";
import { PromptForm } from "@/components/PromptForm";
import {
  type RepositoryConfig,
  RepositoryForm,
} from "@/components/RepositoryForm";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { ThinkingLogs } from "@/components/ThinkingLogs";
import { useAgent } from "@/hooks/useAgent";

interface HomePageProps {
  currentModel: string;
}

export function HomePage({ currentModel }: HomePageProps) {
  const [step, setStep] = useState<"repository" | "prompt">("prompt");
  const [repositoryConfig, setRepositoryConfig] = useState<RepositoryConfig>({
    repoUrl: "https://github.com/richardjzhang/coding-agent",
    githubToken: "",
  });
  const [prompt, setPrompt] = useState(
    "Explain what the code in this repository does."
  );
  const [repositoryError, setRepositoryError] = useState<string | null>(null);

  const { isLoading, result, error, thinkingLogs, executeAgent } = useAgent();

  const handleRepositoryConfigChange = (
    field: keyof RepositoryConfig,
    value: string
  ) => {
    setRepositoryConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleRepositorySubmit = () => {
    if (!repositoryConfig.repoUrl.trim()) {
      setRepositoryError("Please enter a repository URL");
      return;
    }

    if (!repositoryConfig.repoUrl.startsWith("https://github.com/")) {
      setRepositoryError("Repository URL must start with https://github.com/");
      return;
    }

    setRepositoryError(null);
    setStep("prompt");
  };

  const handlePromptSubmit = () => {
    if (!prompt.trim()) {
      return;
    }

    executeAgent({
      prompt,
      repoUrl: repositoryConfig.repoUrl,
      githubToken: repositoryConfig.githubToken || undefined,
    });
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
            <Sparkles className="h-4 w-4" />
            Code Analysis Tool
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-4 text-gray-900">
            Code Agent
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Point this at any GitHub repo and tell it what to do. It can analyze
            code, fix bugs, add features, and submit PRs. Just describe what you
            want in plain English.
          </p>
        </div>

        {/* Repository Configuration Step */}
        {step === "repository" && (
          <RepositoryForm
            config={repositoryConfig}
            onChange={handleRepositoryConfigChange}
            onSubmit={handleRepositorySubmit}
            error={repositoryError}
          />
        )}

        {/* Prompt Step */}
        {step === "prompt" && (
          <PromptForm
            prompt={prompt}
            onPromptChange={setPrompt}
            onSubmit={handlePromptSubmit}
            repositoryConfig={repositoryConfig}
            onChangeRepository={() => setStep("repository")}
            isLoading={isLoading}
            currentModel={currentModel}
          />
        )}

        {/* Error Display */}
        {error && <ErrorDisplay error={error} />}

        {/* Thinking Logs Display (during loading) */}
        <ThinkingLogs logs={thinkingLogs} isLoading={isLoading} />

        {/* Results Display */}
        {result && (
          <ResultsDisplay result={result} thinkingLogs={thinkingLogs} />
        )}

        {/* Footer */}
        <div className="text-center mt-16">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>Powered by</span>
            <Image
              src="/vercel-logo.svg"
              alt="Vercel"
              width={2048}
              height={407}
              className="h-4 w-auto opacity-75"
              unoptimized
            />
          </div>
        </div>
      </div>
    </main>
  );
}
