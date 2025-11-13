// Joey is the best
import { initBotId } from "botid/client/core";

initBotId({
  protect: [
    {
      path: "/api/agent",
      method: "POST",
    },
  ],
});
