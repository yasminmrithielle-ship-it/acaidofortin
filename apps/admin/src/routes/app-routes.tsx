import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "../components/app-shell";
import { DashboardPage } from "../features/dashboard/dashboard-page";
import { PromotionsPage } from "../features/dashboard/promotions-page";
import { ChatbotPage } from "../features/chatbot/chatbot-page";
import { OrdersPage } from "../features/orders/orders-page";
import { ProductsPage } from "../features/products/products-page";
import { ReportsPage } from "../features/reports/reports-page";

type Props = {
  token: string;
  onLogout: () => void;
};

export function AppRoutes({ token, onLogout }: Props) {
  return (
    <Routes>
      <Route element={<AppShell onLogout={onLogout} />}>
        <Route index element={<DashboardPage token={token} />} />
        <Route path="/orders" element={<OrdersPage token={token} />} />
        <Route path="/products" element={<ProductsPage token={token} />} />
        <Route path="/promotions" element={<PromotionsPage token={token} />} />
        <Route path="/reports" element={<ReportsPage token={token} />} />
        <Route path="/chatbot" element={<ChatbotPage token={token} />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
