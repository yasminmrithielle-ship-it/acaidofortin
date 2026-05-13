import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";

import { SectionHeader } from "../../components/section-header";
import { StatusStepper } from "../../components/status-stepper";
import { trackOrder } from "../../services/api";
import { useAppTheme } from "../../theme/theme";
import { OrderRecord } from "../../types/app";
import { formatCurrency, formatOrderDate } from "../../utils/currency";

function getOrderCode(order: OrderRecord) {
  return order.publicCode ?? `FRT-${order.id.slice(-6).toUpperCase()}`;
}

export function OrdersScreen() {
  const { palette } = useAppTheme();
  const [orderCode, setOrderCode] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleTrackOrder() {
    const code = orderCode.trim();

    if (!code) {
      Alert.alert("Numero do pedido", "Cole o numero recebido pelo WhatsApp.");
      return;
    }

    setLoading(true);

    try {
      const order = await trackOrder(code);
      setTrackedOrder(order);
    } catch {
      Alert.alert("Pedido nao encontrado", "Confira o numero recebido no WhatsApp e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <SectionHeader subtitle="Cole o numero recebido pelo WhatsApp" title="Acompanhar pedido" />

      <View style={[styles.lookupCard, { backgroundColor: palette.card }]}>
        <TextInput
          autoCapitalize="characters"
          onChangeText={setOrderCode}
          placeholder="Ex: FRT-204"
          placeholderTextColor={palette.muted}
          style={[styles.input, { backgroundColor: palette.cardSoft, color: palette.text }]}
          value={orderCode}
        />
        <Pressable
          onPress={handleTrackOrder}
          style={[styles.trackButton, { backgroundColor: palette.accent }]}
        >
          <Text style={styles.trackButtonText}>{loading ? "Consultando..." : "Ver atualizacoes"}</Text>
        </Pressable>
      </View>

      {trackedOrder ? (
        <View style={[styles.activeCard, { backgroundColor: palette.card }]}>
          <Text style={[styles.activeTitle, { color: palette.text }]}>Pedido #{getOrderCode(trackedOrder)}</Text>
          <Text style={[styles.activeMeta, { color: palette.muted }]}>
            {formatOrderDate(trackedOrder.createdAt)} - {trackedOrder.estimatedMinutes} min estimados
          </Text>
          <StatusStepper status={trackedOrder.status} />
          <View style={styles.summary}>
            <Text style={[styles.cardMeta, { color: palette.text }]}>
              {trackedOrder.items.map((item) => `${item.quantity}x ${item.productName}`).join(", ")}
            </Text>
            <Text style={[styles.cardMeta, { color: palette.muted }]}>Total: {formatCurrency(trackedOrder.total)}</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: palette.card }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Sem pedido carregado</Text>
          <Text style={[styles.cardMeta, { color: palette.muted }]}>
            Depois de finalizar, copie o numero enviado no WhatsApp e cole aqui para ver o andamento.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16
  },
  lookupCard: {
    borderRadius: 26,
    padding: 18,
    gap: 12
  },
  input: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontFamily: "Sora_400Regular"
  },
  trackButton: {
    minHeight: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  trackButtonText: {
    color: "#fff",
    fontFamily: "Sora_700Bold",
    fontSize: 14
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
  summary: {
    gap: 6
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
