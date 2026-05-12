import bcrypt from "bcryptjs";

import { UserRole } from "@prisma/client";

import { AppError } from "../../../lib/errors";
import { signToken } from "../../../lib/jwt";
import { prisma } from "../../../lib/prisma";

type RegisterInput = {
  name: string;
  email: string;
  phone?: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type SocialLoginInput = {
  provider: "google" | "apple";
  providerId: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

function sanitizeUser<T extends { passwordHash?: string | null }>(user: T) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function buildAuthResponse(user: {
  id: string;
  email: string;
  role: UserRole;
  passwordHash?: string | null;
  [key: string]: unknown;
}) {
  return {
    token: signToken({
      sub: user.id,
      email: user.email,
      role: user.role
    }),
    user: sanitizeUser(user)
  };
}

export const authService = {
  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new AppError(409, "E-mail já cadastrado");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        loyaltyAccount: {
          create: {}
        }
      }
    });

    return buildAuthResponse(user);
  },

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user?.passwordHash) {
      throw new AppError(401, "Credenciais inválidas");
    }

    const passwordMatches = await bcrypt.compare(data.password, user.passwordHash);

    if (!passwordMatches) {
      throw new AppError(401, "Credenciais inválidas");
    }

    return buildAuthResponse(user);
  },

  async socialLogin(data: SocialLoginInput) {
    const isGoogle = data.provider === "google";

    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {
        name: data.name,
        avatarUrl: data.avatarUrl,
        ...(isGoogle ? { googleId: data.providerId } : { appleId: data.providerId })
      },
      create: {
        name: data.name,
        email: data.email,
        avatarUrl: data.avatarUrl,
        role: UserRole.CUSTOMER,
        ...(isGoogle ? { googleId: data.providerId } : { appleId: data.providerId }),
        loyaltyAccount: {
          create: {}
        }
      }
    });

    return buildAuthResponse(user);
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
        loyaltyAccount: true
      }
    });

    if (!user) {
      throw new AppError(404, "Usuário não encontrado");
    }

    return sanitizeUser(user);
  }
};

