import { Request, Response } from "express";

export function notFoundHandler(_request: Request, response: Response) {
  return response.status(404).json({
    message: "Rota não encontrada"
  });
}

