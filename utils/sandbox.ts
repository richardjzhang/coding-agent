// Sandbox uses your  OIDC token to authenticate

import { Sandbox } from "@vercel/sandbox";
import ms from "ms";

export interface GitHubArgs {
  repoUrl: string;
  githubToken?: string;
}

export const createSandbox = async ({ repoUrl, githubToken }: GitHubArgs) => {
  const sandbox = await Sandbox.create({
    source: {
      url: repoUrl,
      type: "git",
      ...(githubToken
        ? { username: "x-access-token", password: githubToken! }
        : {}),
    },
    resources: { vcpus: 2 },
    timeout: ms("5m"),
    ports: [3000],
    runtime: "node22",
  });

  return sandbox;
};

export const readFile = async (sandbox: Sandbox, path: string) => {
  console.log(`Reading file: ${path}`);
  const result = await sandbox.runCommand("cat", [path]);
  const data = await result.output();
  console.log(`File read successfully: ${path} ${data}`);
  return { path, content: data.toString() };
};

export const listFiles = async (sandbox: Sandbox, path: string | null) => {
  const targetPath = path && path.length > 0 ? path : ".";
  console.log(`Listing files in: ${targetPath}`);
  const result = await sandbox.runCommand("ls", ["-la", targetPath]);
  const results = await result.output();
  console.log(`Files listed successfully for: ${targetPath}\n${results}`);
  return results.toString();
};

export const editFile = async (
  sandbox: Sandbox,
  path: string,
  old_str: string,
  new_str: string
) => {
  console.log(`Editing file: ${path}`);
  // Read the file content using sandbox
  const result = await sandbox
    .runCommand("cat", [path])
    .catch(() => ({ output: () => "" }));
  const content = await result.output();
  const contentStr = content.toString();

  const updatedContent = contentStr.replace(old_str, new_str);
  if (contentStr === updatedContent && old_str !== new_str) {
    console.log(`String "${old_str}" not found in file ${path}`);
    return { error: `String "${old_str}" not found in file` };
  }

  // Write the updated content back using sandbox writeFiles method
  await sandbox.writeFiles([
    {
      path: path,
      stream: Buffer.from(updatedContent, "utf8"),
    },
  ]);
  console.log(`File edited successfully: ${path}`);
  // Get and print the updated file content
  const updatedResult = await sandbox.runCommand("cat", [path]);
  const updatedFileContent = await updatedResult.output();
  console.log(`Updated file content for ${path}:\n${updatedFileContent}`);
  return { success: true };
};

interface GitHubUser {
  login: string;
  name?: string;
  email?: string;
}

const validateGitHubToken = async (
  sandbox: Sandbox,
  githubToken: string
): Promise<
  { valid: true; user: Required<GitHubUser> } | { valid: false; error?: string }
> => {
  try {
    const response = await sandbox.runCommand("curl", [
      "-s",
      "-H",
      `Authorization: token ${githubToken}`,
      "-H",
      "Accept: application/vnd.github.v3+json",
      "https://api.github.com/user",
    ]);

    const result = JSON.parse((await response.output()).toString());

    if (result.login) {
      return {
        valid: true,
        user: {
          login: result.login,
          name: result.name || result.login,
          email: result.email || `${result.login}@users.noreply.github.com`,
        },
      };
    } else if (result.message) {
      return {
        valid: false,
        error: `Token validation failed: ${result.message}`,
      };
    } else {
      return {
        valid: false,
        error: "Token validation failed: Invalid response",
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: `Token validation error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};

export const createPR = async (
  sandbox: Sandbox,
  { repoUrl, githubToken }: GitHubArgs,
  prDetails: { title: string; body: string; branch: string | null }
) => {
  try {
    if (!githubToken)
      throw new Error("GitHub token is required to create a PR");

    // Validate GitHub token
    const tokenValidation = await validateGitHubToken(sandbox, githubToken);
    if (!tokenValidation.valid) {
      throw new Error(tokenValidation.error || "Invalid GitHub token");
    }

    const { user } = tokenValidation;
    const { title, body, branch } = prDetails;
    console.log(
      `Creating PR with title: ${title}, body: ${body}, branch: ${branch}`
    );
    console.log(`Using GitHub user: ${user!.name} (${user!.login})`);

    const branchName = `${branch || `feature/ai-changes`}-${Date.now()}`;

    // Setup git with actual user details
    await sandbox.runCommand("git", ["config", "user.email", user.email]);
    await sandbox.runCommand("git", ["config", "user.name", user.name]);

    const authUrl = repoUrl!.replace(
      "https://github.com/",
      `https://${githubToken}@github.com/`
    );
    await sandbox.runCommand("git", ["remote", "set-url", "origin", authUrl]);

    // Create branch and commit changes
    await sandbox.runCommand("git", ["checkout", "-b", branchName]);
    await sandbox.runCommand("git", [
      "add",
      ".",
      ":!*.tar",
      ":!*.tar.gz",
      ":!*.tar.bz2",
      ":!*.tar.xz",
      ":!*.tgz",
      ":!*.tbz",
      ":!*.tbz2",
      ":!*.txz",
    ]);

    // Check if there are changes to commit
    const diffResult = await sandbox.runCommand("git", [
      "diff",
      "--cached",
      "--name-only",
    ]);
    const diffOutput = await diffResult.output();

    if (!diffOutput.toString().trim()) {
      // Create a minimal change if nothing to commit
      const timestamp = new Date().toISOString();
      await sandbox.runCommand("bash", [
        "-c",
        `echo "AI Agent Activity: ${timestamp}" > .ai-activity.md`,
      ]);
      await sandbox.runCommand("git", [
        "add",
        ".",
        ":!*.tar",
        ":!*.tar.gz",
        ":!*.tar.bz2",
        ":!*.tar.xz",
        ":!*.tgz",
        ":!*.tbz",
        ":!*.tbz2",
        ":!*.txz",
      ]);
    }

    const commitMessage = `${title}

Co-authored-by: Github Repo Agent <noreply@${
      process.env.VERCEL_PROJECT_PRODUCTION_URL || "example.com"
    }>`;
    await sandbox.runCommand("git", ["commit", "-m", commitMessage]);
    await sandbox.runCommand("git", ["push", "origin", branchName]);

    // Create PR via GitHub API
    const urlMatch = repoUrl!.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    if (!urlMatch) throw new Error("Invalid GitHub repository URL");

    const [, owner, repo] = urlMatch;
    const prData = { title, body, head: branchName, base: "main" };

    const response = await sandbox.runCommand("curl", [
      "-s",
      "-X",
      "POST",
      "-H",
      `Authorization: token ${githubToken}`,
      "-H",
      "Accept: application/vnd.github.v3+json",
      "-H",
      "Content-Type: application/json",
      "-d",
      JSON.stringify(prData),
      `https://api.github.com/repos/${owner}/${repo}/pulls`,
    ]);

    const result = JSON.parse((await response.output()).toString());

    if (result.html_url) {
      return {
        success: true,
        branch: branchName,
        pr_url: result.html_url,
        pr_number: result.number,
      };
    } else {
      throw new Error(result.message || "Failed to create PR");
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
