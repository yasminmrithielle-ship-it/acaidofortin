import { createServer } from "http";

import { env } from "./config/env";
import { app } from "./app";
import { logger } from "./lib/logger";
import { initSocket } from "./lib/socket";

const server = createServer(app);

initSocket(server);

server.listen(env.PORT, () => {
  logger.info(`Açaí do Fortin API rodando na porta ${env.PORT}`);
});
