import { Request, Response } from "express";

import { whatsappService } from "../services/whatsapp.service";

export const whatsappController = {
  async connection(_request: Request, response: Response) {
    const result = await whatsappService.getConnection();
    return response.json(result);
  }
};
