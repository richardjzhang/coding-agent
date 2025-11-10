# Github Repo Agent

This project is a Next.js web and API application that allows you to run an AI-powered coding agent against remote JavaScript/TypeScript GitHub repositories. The agent can read, analyze, modify code, and create pull requests based on user instructions.

## Features

- **Web UI** — Interactively select a GitHub repo, enter a prompt, and view progress and results live.
- **API** — Send a prompt and repo URL to `/api/agent` to trigger the agent programmatically.
- **Automatic code analysis and editing** — The agent uses language models to understand your prompt, inspect the repository, and make relevant code changes.
- **PR Automation** — All code changes are submitted as a pull request.
- **Sandboxed Execution** — Uses Vercel Sandbox to safely interact with repo files.

## How it Works

1. Accepts a prompt (instruction) and a GitHub repository URL.
2. Clones the target repository into a secure sandbox.
3. The agent inspects code, makes changes, and opens a pull request with its modifications.
4. Progress and results stream back to the requester (UI or API).

## Local Setup

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fship-25-agents-workshop-starter)

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy via the button above, or clone locally.
3. Run `vercel link` to connect your local repo.
4. Pull env vars: `vercel env pull`
5. Install dependencies: `pnpm install`
6. Start dev: `vercel dev`

## Environment Variables

- `VERCEL_OIDC_TOKEN` — Auto-added on `vercel dev`
- `GITHUB_TOKEN` — A personal access token with repo permissions

### Creating a GitHub Token

1. Go to [your tokens page](https://github.com/settings/personal-access-tokens)
2. Generate a new token with **repo**, **pull requests**, and **issues** (read/write)
3. Add it to your `.env.local` as `GITHUB_TOKEN`

## Usage

### Web UI

1. Open the site in your browser
2. Enter a public repo URL and your prompt
3. Watch the agent analyze and update the code, then review its PR

### API

```
curl -X POST https://your-deployment.vercel.app/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Refactor the utils directory to use ES modules.",
    "repoUrl": "https://github.com/your-user/your-repo"
  }'
```

- `prompt`: What you want the agent to do
- `repoUrl`: GitHub repository URL
- `githubToken`: (optional) A GitHub PAT (defaults to server env)

## Technology

- Next.js (App Router, Server Actions & API Route)
- Vercel AI SDK
- Vercel Sandbox
- OpenAI GPT model
- Tailwind CSS
- Zod

## Limitations

- Only JS/TS repos
- Only public repos unless your token has access
- All changes go through PR
- Prompt-based and experimental (results may vary)

---

Licensed under the MIT License. See [LICENSE](LICENSE) for details.
