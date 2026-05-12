import "express-async-errors";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";

import { env } from "./config/env";
import { errorHandler } from "./middlewares/error-handler";
import { notFoundHandler } from "./middlewares/not-found";
import { requestLogger } from "./middlewares/request-logger";
import { apiRoutes } from "./routes";

const app = express();
const openApiDocument = YAML.load(path.join(process.cwd(), "src", "docs", "openapi.yaml"));

app.use(cors({ origin: env.FRONTEND_ORIGIN === "*" ? true : env.FRONTEND_ORIGIN }));
app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.use("/api", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
