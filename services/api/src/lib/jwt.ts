import jwt from "jsonwebtoken";

import { UserRole } from "@prisma/client";

import { env } from "../config/env";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export function signToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "7d"
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
}

