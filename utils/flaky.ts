// Simulates flaky network/API calls for demo purposes
// First attempt always fails, subsequent attempts succeed

const toolAttempts = new Map<string, number>();

export function shouldFailFirstAttempt(
  toolName: string,
  identifier?: string
): boolean {
  const key = `${toolName}:${identifier || "default"}`;
  const attempts = toolAttempts.get(key) || 0;
  toolAttempts.set(key, attempts + 1);

  // First attempt always fails
  return attempts === 0;
}

export function resetAttempts(): void {
  toolAttempts.clear();
}
