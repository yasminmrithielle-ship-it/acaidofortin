import { v2 as cloudinary } from "cloudinary";

import { env } from "../config/env";
import { AppError } from "./errors";

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET
  });
}

export async function uploadBuffer(buffer: Buffer, folder: string) {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new AppError(500, "Cloudinary não configurado");
  }

  const dataUri = `data:image/jpeg;base64,${buffer.toString("base64")}`;

  return cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image"
  });
}

