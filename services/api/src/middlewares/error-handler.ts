import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { AppError } from "../lib/errors";
import { logger } from "../lib/logger";

export function errorHandler(error: Error, _request: Request, response: Response, _next: NextFunction) {
  logger.error(error);

  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      message: error.message,
      details: error.details ?? null
    });
  }

  if (error instanceof ZodError) {
    return response.status(400).json({
      message: "Dados inválidos",
      details: error.flatten()
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return response.status(400).json({
      message: "Erro de banco de dados",
      details: error.message
    });
  }

  return response.status(500).json({
    message: "Erro interno do servidor"
  });
}

