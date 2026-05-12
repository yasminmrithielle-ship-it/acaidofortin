import { ScrollView, StyleSheet, Text, View } from "react-native";

import { SectionHeader } from "../../components/section-header";
import { StatusStepper } from "../../components/status-stepper";
import { useApp } from "../../store/app-context";
import { useAppTheme } from "../../theme/theme";
import { formatCurrency, formatOrderDate } from "../../utils/currency";

export function OrdersScreen() {
  const { orders } = useApp();
  const { palette } = useAppTheme();
  const activeOrder = orders.find((order) => order.status !== "DELIVERED" && order.status !== "CANCELED");

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <SectionHeader subtitle="Rastreamento ao vivo e histórico" title="Seus pedidos" />

      {activeOrder ? (
        <View style={[styles.activeCard, { backgroundColor: palette.card }]}>
          <Text style={[styles.activeTitle, { color: palette.text }]}>Pedido em andamento</Text>
          <Text style={[styles.activeMeta, { color: palette.muted }]}>
            #{activeOrder.id.slice(-6)} • {activeOrder.estimatedMinutes} min estimados
          </Text>
          <StatusStepper status={activeOrder.status} />
        </View>
      ) : null}

      {orders.map((order) => (
        <View key={order.id} style={[styles.card, { backgroundColor: palette.card }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>#{order.id.slice(-6)}</Text>
          <Text style={[styles.cardMeta, { color: palette.muted }]}>{formatOrderDate(order.createdAt)}</Text>
          <Text style={[styles.cardMeta, { color: palette.text }]}>{formatCurrency(order.total)}</Text>
          <Text style={[styles.cardMeta, { color: palette.muted }]}>{order.items.map((item) => `${item.quantity}x ${item.productName}`).join(", ")}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16
  },
  activeCard: {
    borderRadius: 28,
    padding: 20,
    gap: 14
  },
  activeTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 18
  },
  activeMeta: {
    fontFamily: "Sora_400Regular",
    fontSize: 13
  },
  card: {
    borderRadius: 24,
    padding: 18,
    gap: 6
  },
  cardTitle: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 15
  },
  cardMeta: {
    fontFamily: "Sora_400Regular",
    fontSize: 13
  }
});

