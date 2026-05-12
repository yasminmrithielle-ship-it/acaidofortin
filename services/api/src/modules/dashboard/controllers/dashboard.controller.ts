import { Request, Response } from "express";

import { dashboardService } from "../services/dashboard.service";

export const dashboardController = {
  async summary(_request: Request, response: Response) {
    const result = await dashboardService.getSummary();
    return response.json(result);
  }
};

