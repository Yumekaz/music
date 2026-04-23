import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { logger } from "./utils/logger.js";

const app = createApp({ corsOrigin: env.corsOrigin });

app.listen(env.port, () => {
  logger.info(`listening on http://localhost:${env.port}`);
});
