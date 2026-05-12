import { Request, Response } from "express";

import { productsService } from "../services/products.service";

export const productsController = {
  async list(request: Request, response: Response) {
    const result = await productsService.list(request.query as Record<string, string>);
    return response.json(result);
  },

  async listAdmin(_request: Request, response: Response) {
    const result = await productsService.listAdmin();
    return response.json(result);
  },

  async getById(request: Request, response: Response) {
    const result = await productsService.getById(String(request.params.id));
    return response.json(result);
  },

  async create(request: Request, response: Response) {
    const result = await productsService.create(request.body);
    return response.status(201).json(result);
  },

  async update(request: Request, response: Response) {
    const result = await productsService.update(String(request.params.id), request.body);
    return response.json(result);
  }
};
