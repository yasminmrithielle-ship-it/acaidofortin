import { Request, Response } from "express";

import { uploadsService } from "../services/uploads.service";

export const uploadsController = {
  async uploadProductImage(request: Request, response: Response) {
    const result = await uploadsService.uploadProductImage(request.file!);
    return response.status(201).json(result);
  }
};

