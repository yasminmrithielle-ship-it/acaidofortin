import { Request, Response } from "express";

import { customersService } from "../services/customers.service";

export const customersController = {
  async listCustomers(_request: Request, response: Response) {
    const result = await customersService.listCustomers();
    return response.json(result);
  },

  async getMe(request: Request, response: Response) {
    const result = await customersService.getMe(request.user!.sub);
    return response.json(result);
  },

  async addAddress(request: Request, response: Response) {
    const result = await customersService.addAddress(request.user!.sub, request.body);
    return response.status(201).json(result);
  },

  async getFavorites(request: Request, response: Response) {
    const result = await customersService.getFavorites(request.user!.sub);
    return response.json(result);
  },

  async toggleFavorite(request: Request, response: Response) {
    const result = await customersService.toggleFavorite(request.user!.sub, request.params.productId);
    return response.json(result);
  }
};

