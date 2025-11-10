import type { Sandbox } from "@vercel/sandbox";
import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod/v4";
import { modelFlag } from "@/lib/flags";
import {
  createIssue,
  createPR,
  createSandbox,
  editFile,
  listFiles,
  readFile,
} from "./sandbox";

export interface CodingAgentArgs {
  prompt: string;
  repoUrl: string;
  githubToken?: string;
  onProgress?: (
    message: string,
    type: "thinking" | "result" | "complete"
  ) => void;
}

export async function codingAgent({
  prompt,
  repoUrl,
  githubToken,
  onProgress,
}: CodingAgentArgs) {
  console.log(
    "prompt:",
    prompt,
    "repoUrl:",
    repoUrl,
    "githubToken:",
    githubToken ? "provided" : "default"
  );

  const githubArgs = {
    repoUrl,
    githubToken: githubToken || process.env.GITHUB_TOKEN || undefined,
  };
  let sandbox: Sandbox | undefined;

  const model = await modelFlag();

  onProgress?.("Starting analysis of the repository...", "thinking");

  const result = await generateText({
    model,
    prompt,
    system:
      "You are a coding agent. You will be working with js/ts projects. Your responses must be concise. If you make changes to the codebase, be sure to run the create_pr tool once you are done. You can also create GitHub issues using the create_issue tool to document bugs, feature requests, or tasks.",
    stopWhen: stepCountIs(20),
    tools: {
      read_file: tool({
        description:
          "Read the contents of a given relative file path. Use this when you want to see what's inside a file. Do not use this with directory names.",
        inputSchema: z.object({
          path: z
            .string()
            .describe("The relative path of a file in the working directory."),
        }),
        execute: async ({ path }) => {
          try {
            if (!sandbox) {
              onProgress?.("Setting up development environment...", "thinking");
              sandbox = await createSandbox(githubArgs);
            }
            onProgress?.(`Reading file: ${path}`, "thinking");
            const output = await readFile(sandbox, path);
            return { path, output };
          } catch (e) {
            const error = e as Error;
            console.error(`Error reading file at ${path}:`, error.message);
            return { path, error: error.message };
          }
        },
      }),
      list_files: tool({
        description:
          "List files and directories at a given path. If no path is provided, lists files in the current directory.",
        inputSchema: z.object({
          path: z
            .string()
            .nullable()
            .describe(
              "Optional relative path to list files from. Defaults to current directory if not provided."
            ),
        }),
        execute: async ({ path }) => {
          if (path === ".git" || path === "node_modules") {
            return { error: "You cannot read the path: ", path };
          }
          try {
            if (!sandbox) {
              onProgress?.("Setting up development environment...", "thinking");
              sandbox = await createSandbox(githubArgs);
            }
            onProgress?.(
              `Listing files in: ${path || "root directory"}`,
              "thinking"
            );
            const output = await listFiles(sandbox, path);
            return { path, output };
          } catch (e) {
            console.error(`Error listing files:`, e);
            return { error: e };
          }
        },
      }),
      edit_file: tool({
        description:
          "Make edits to a text file. Replaces 'old_str' with 'new_str' in the given file. 'old_str' and 'new_str' MUST be different from each other. If the file specified with path doesn't exist, it will be created.",
        inputSchema: z.object({
          path: z.string().describe("The path to the file"),
          old_str: z
            .string()
            .describe(
              "Text to search for - must match exactly and must only have one match exactly"
            ),
          new_str: z.string().describe("Text to replace old_str with"),
        }),
        execute: async ({ path, old_str, new_str }) => {
          try {
            if (!sandbox) {
              onProgress?.("Setting up development environment...", "thinking");
              sandbox = await createSandbox(githubArgs);
            }
            onProgress?.(`Editing file: ${path}`, "thinking");
            await editFile(sandbox, path, old_str, new_str);
            return { success: true };
          } catch (e) {
            console.error(`Error editing file ${path}:`, e);
            return { error: e };
          }
        },
      }),
      create_pr: tool({
        description:
          "Create a pull request with the current changes. This will add all files, commit changes, push to a new branch, and create a PR using GitHub's REST API. Use this as the final step when making changes.",
        inputSchema: z.object({
          title: z.string().describe("The title of the pull request"),
          body: z.string().describe("The body/description of the pull request"),
          branch: z
            .string()
            .nullable()
            .describe(
              "The name of the branch to create (defaults to a generated name)"
            ),
        }),
        execute: async ({ title, body, branch }) => {
          // Verify GitHub token is provided
          if (!githubArgs.githubToken) {
            return {
              error:
                "GitHub token is required to create a pull request. Please provide a valid GitHub token.",
            };
          }

          onProgress?.("Validating GitHub token...", "thinking");
          onProgress?.("Creating pull request...", "thinking");

          const result = await createPR(sandbox!, githubArgs, {
            title,
            body,
            branch,
          });

          if (result.error) {
            return { error: result.error };
          }

          return { success: true, linkToPR: result.pr_url };
        },
      }),
      create_issue: tool({
        description:
          "Create a GitHub issue in the repository. Use this to report bugs, request features, or document tasks that need to be done.",
        inputSchema: z.object({
          title: z.string().describe("The title of the issue"),
          body: z.string().describe("The body/description of the issue"),
          labels: z
            .array(z.string())
            .optional()
            .describe(
              "Optional array of label names to add to the issue (e.g., ['bug', 'enhancement'])"
            ),
        }),
        execute: async ({ title, body, labels }) => {
          // Verify GitHub token is provided
          if (!githubArgs.githubToken) {
            return {
              error:
                "GitHub token is required to create an issue. Please provide a valid GitHub token.",
            };
          }

          if (!sandbox) {
            onProgress?.("Setting up development environment...", "thinking");
            sandbox = await createSandbox(githubArgs);
          }

          onProgress?.("Creating GitHub issue...", "thinking");

          const result = await createIssue(sandbox, githubArgs, {
            title,
            body,
            labels,
          });

          if (result.error) {
            return { error: result.error };
          }

          return {
            success: true,
            linkToIssue: result.issue_url,
            issueNumber: result.issue_number,
          };
        },
      }),
    },
  });

  if (sandbox) {
    onProgress?.("Cleaning up environment...", "thinking");
    await sandbox.stop();
  }

  onProgress?.("Analysis complete!", "result");
  return { response: result.text };
}
