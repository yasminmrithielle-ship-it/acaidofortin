import { uploadBuffer } from "../../../lib/cloudinary";

export const uploadsService = {
  async uploadProductImage(file: Express.Multer.File) {
    const result = await uploadBuffer(file.buffer, "acai-do-fortin/products");

    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  }
};

