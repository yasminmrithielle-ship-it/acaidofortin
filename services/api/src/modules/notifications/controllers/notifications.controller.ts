import { Request, Response } from "express";

import { notificationsService } from "../services/notifications.service";

export const notificationsController = {
  async mine(request: Request, response: Response) {
    const result = await notificationsService.getMine(request.user!.sub);
    return response.json(result);
  },

  async broadcast(request: Request, response: Response) {
    const result = await notificationsService.broadcast(request.body);
    return response.status(201).json(result);
  }
};

