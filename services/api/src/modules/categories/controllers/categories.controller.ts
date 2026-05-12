import { Request, Response } from "express";

import { categoriesService } from "../services/categories.service";

export const categoriesController = {
  async listPublic(_request: Request, response: Response) {
    const result = await categoriesService.listPublic();
    return response.json(result);
  },

  async listAdmin(_request: Request, response: Response) {
    const result = await categoriesService.listAdmin();
    return response.json(result);
  },

  async create(request: Request, response: Response) {
    const result = await categoriesService.create(request.body);
    return response.status(201).json(result);
  },

  async update(request: Request, response: Response) {
    const result = await categoriesService.update(String(request.params.id), request.body);
    return response.json(result);
  }
};
