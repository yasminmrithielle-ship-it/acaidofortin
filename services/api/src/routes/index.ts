import { Router } from "express";

import { authRoutes } from "../modules/auth/routes/auth.routes";
import { bannersRoutes } from "../modules/banners/routes/banners.routes";
import { categoriesRoutes } from "../modules/categories/routes/categories.routes";
import { couponsRoutes } from "../modules/coupons/routes/coupons.routes";
import { customersRoutes } from "../modules/customers/routes/customers.routes";
import { dashboardRoutes } from "../modules/dashboard/routes/dashboard.routes";
import { loyaltyRoutes } from "../modules/loyalty/routes/loyalty.routes";
import { notificationsRoutes } from "../modules/notifications/routes/notifications.routes";
import { ordersRoutes } from "../modules/orders/routes/orders.routes";
import { productsRoutes } from "../modules/products/routes/products.routes";
import { reviewsRoutes } from "../modules/reviews/routes/reviews.routes";
import { uploadsRoutes } from "../modules/uploads/routes/uploads.routes";

export const apiRoutes = Router();

apiRoutes.get("/health", (_request, response) => {
  response.json({
    name: "Açaí do Fortin API",
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/banners", bannersRoutes);
apiRoutes.use("/categories", categoriesRoutes);
apiRoutes.use("/products", productsRoutes);
apiRoutes.use("/coupons", couponsRoutes);
apiRoutes.use("/orders", ordersRoutes);
apiRoutes.use("/customers", customersRoutes);
apiRoutes.use("/dashboard", dashboardRoutes);
apiRoutes.use("/notifications", notificationsRoutes);
apiRoutes.use("/loyalty", loyaltyRoutes);
apiRoutes.use("/reviews", reviewsRoutes);
apiRoutes.use("/uploads", uploadsRoutes);

