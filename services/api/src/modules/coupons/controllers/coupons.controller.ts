import { Request, Response } from "express";

import { couponsService } from "../services/coupons.service";

export const couponsController = {
  async list(_request: Request, response: Response) {
    const result = await couponsService.list();
    return response.json(result);
  },

  async listPublic(_request: Request, response: Response) {
    const result = await couponsService.listPublic();
    return response.json(result);
  },

  async create(request: Request, response: Response) {
    const result = await couponsService.create(request.body);
    return response.status(201).json(result);
  },

  async validate(request: Request, response: Response) {
    const result = await couponsService.validate(request.body.code, request.body.subtotal);
    return response.json(result);
  }
};
