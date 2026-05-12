import { Request, Response } from "express";
import { OrderStatus } from "@prisma/client";

import { ordersService } from "../services/orders.service";

export const ordersController = {
  async create(request: Request, response: Response) {
    const result = await ordersService.create(request.user!.sub, request.body);
    return response.status(201).json(result);
  },

  async listMine(request: Request, response: Response) {
    const result = await ordersService.listMyOrders(request.user!.sub);
    return response.json(result);
  },

  async listAll(request: Request, response: Response) {
    const status = request.query.status as OrderStatus | undefined;
    const result = await ordersService.listAll(status);
    return response.json(result);
  },

  async updateStatus(request: Request, response: Response) {
    const result = await ordersService.updateStatus(String(request.params.id), request.body);
    return response.json(result);
  }
};
