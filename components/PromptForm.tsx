// Joey is the best
import { Github, Loader2, Send, Settings, Zap } from "lucide-react";
import { useId } from "react";
import type { RepositoryConfig } from "./RepositoryForm";

interface PromptFormProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  repositoryConfig: RepositoryConfig;
  onChangeRepository: () => void;
  isLoading: boolean;
  currentModel: string;
}

export function PromptForm({
  prompt,
  onPromptChange,
  onSubmit,
  repositoryConfig,
  onChangeRepository,
  isLoading,
  currentModel,
}: PromptFormProps) {
  const promptId = useId();

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    e.target.select();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="mb-8 bg-white border border-gray-200 rounded-xl shadow-lg">
      <div className="p-8 pb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Submit Request
        </h2>
        <div className="flex items-center gap-2 text-base text-gray-600 mb-4">
          <span>Repository:</span>
          <a
            href={repositoryConfig.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-100 px-2 py-1 rounded flex items-center gap-2 hover:bg-gray-200 transition-colors"
          >
            <Github className="h-4 w-4 text-gray-600" />
            <span className="font-mono text-sm">
              {repositoryConfig.repoUrl.replace("https://github.com/", "")}
            </span>
          </a>
          <button
            type="button"
            onClick={onChangeRepository}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title="Change repository"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-base text-gray-600 mb-4">
          <span>Model:</span>
          <div className="bg-gray-100 px-2 py-1 rounded flex items-center gap-2">
            <Zap className="h-4 w-4 text-gray-600" />
            <span className="font-mono text-sm">
              {currentModel}
            </span>
          </div>
        </div>
      </div>
      <div className="px-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Prompt Field */}
          <div className="space-y-3">
            <label
              htmlFor={promptId}
              className="block text-base font-medium text-gray-900"
            >
              Prompt *
            </label>
            <textarea
              id={promptId}
              placeholder="Example: Analyze the codebase for security vulnerabilities and suggest improvements..."
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              onFocus={handleFocus}
              className="w-full min-h-[140px] px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full h-14 px-8 text-base font-semibold text-white bg-black rounded-lg hover:bg-gray-800 focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Computing...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Execute Request
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
