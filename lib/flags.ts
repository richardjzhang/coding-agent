import { flag } from "flags/next";

const DEFAULT_MODEL = "openai/gpt-5";

export const modelFlag = flag({
  key: "model",
  description: "The LLM the agent uses to generate code.",
  decide: () => DEFAULT_MODEL,
  defaultValue: DEFAULT_MODEL,
});
