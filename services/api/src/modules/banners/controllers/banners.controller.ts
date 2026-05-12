import { Request, Response } from "express";

import { bannersService } from "../services/banners.service";

export const bannersController = {
  async listPublic(_request: Request, response: Response) {
    const result = await bannersService.listPublic();
    return response.json(result);
  },

  async listAdmin(_request: Request, response: Response) {
    const result = await bannersService.listAdmin();
    return response.json(result);
  },

  async create(request: Request, response: Response) {
    const result = await bannersService.create(request.body);
    return response.status(201).json(result);
  },

  async update(request: Request, response: Response) {
    const result = await bannersService.update(String(request.params.id), request.body);
    return response.json(result);
  }
};
