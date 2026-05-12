import { Request, Response } from "express";

import { loyaltyService } from "../services/loyalty.service";

export const loyaltyController = {
  async me(request: Request, response: Response) {
    const result = await loyaltyService.getMyAccount(request.user!.sub);
    return response.json(result);
  },

  async adjust(request: Request, response: Response) {
    const result = await loyaltyService.adjust(request.body);
    return response.json(result);
  }
};

