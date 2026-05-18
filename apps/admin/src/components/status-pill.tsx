import { formatStatusLabel } from "../lib/format";

type Props = {
  label: string;
};

const statusMap: Record<string, string> = {
  PENDING: "status pending",
  CONFIRMED: "status confirmed",
  PREPARING: "status preparing",
  OUT_FOR_DELIVERY: "status delivery",
  DELIVERED: "status delivered",
  CANCELED: "status canceled",
  PAID: "status paid"
};

export function StatusPill({ label }: Props) {
  return <span className={statusMap[label] ?? "status"}>{formatStatusLabel(label)}</span>;
}
