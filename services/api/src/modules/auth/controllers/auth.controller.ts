import { Request, Response } from "express";

import { authService } from "../services/auth.service";

export const authController = {
  async register(request: Request, response: Response) {
    const result = await authService.register(request.body);
    return response.status(201).json(result);
  },

  async login(request: Request, response: Response) {
    const result = await authService.login(request.body);
    return response.json(result);
  },

  async socialLogin(request: Request, response: Response) {
    const result = await authService.socialLogin(request.body);
    return response.json(result);
  },

  async me(request: Request, response: Response) {
    const result = await authService.me(request.user!.sub);
    return response.json(result);
  }
};

