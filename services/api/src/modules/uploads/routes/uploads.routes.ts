import { Router } from "express";
import multer from "multer";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middlewares/authenticate";
import { AppError } from "../../../lib/errors";
import { uploadsController } from "../controllers/uploads.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

export const uploadsRoutes = Router();

uploadsRoutes.post(
  "/products",
  authenticate([UserRole.ADMIN]),
  upload.single("image"),
  (request, _response, next) => {
    if (!request.file) {
      return next(new AppError(400, "Arquivo não enviado"));
    }

    return next();
  },
  uploadsController.uploadProductImage
);

