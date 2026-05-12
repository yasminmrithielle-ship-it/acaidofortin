import { NextFunction, Request, Response } from "express";
import { UserRole } from "@prisma/client";

import { AppError } from "../lib/errors";
import { verifyToken } from "../lib/jwt";

export function authenticate(allowedRoles?: UserRole[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError(401, "Token não informado");
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = verifyToken(token);

    if (allowedRoles && !allowedRoles.includes(payload.role)) {
      throw new AppError(403, "Acesso negado");
    }

    request.user = payload;
    next();
  };
}

