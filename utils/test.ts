import dotenv from "dotenv";
import { codingAgent } from "./agent";

dotenv.config({ path: ".env.local" });
codingAgent({
  prompt:
    "Add a contributing section to the readme of this project. Use standard format.",
  repoUrl: "https://github.com/richardjzhang/coding-agent",
})
  .then(console.log)
  .catch(console.error);
