import { Alert, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from "react-native";
import { useMemo, useState } from "react";

import { AppButton } from "../../components/app-button";
import { SectionHeader } from "../../components/section-header";
import { useApp } from "../../store/app-context";
import { useAppTheme } from "../../theme/theme";
import { formatCurrency } from "../../utils/currency";

export function CartScreen() {
  const { cart, checkout, removeCartItem, updateCartItemQuantity } = useApp();
  const { palette } = useAppTheme();
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CARD" | "CASH">("PIX");
  const [couponCode, setCouponCode] = useState("");

  const subtotal = useMemo(
    () =>
      cart.reduce((total, item) => {
        const addOnsTotal = item.selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
        return total + (item.selectedSize.price + addOnsTotal) * item.quantity;
      }, 0),
    [cart]
  );

  async function handleCheckout() {
    if (cart.length === 0) {
      Alert.alert("Carrinho vazio", "Adicione um produto antes de finalizar o pedido.");
      return;
    }

    await checkout(paymentMethod, couponCode);
    Alert.alert("Pedido enviado", "Seu pedido entrou na fila de preparo.");
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <SectionHeader subtitle="Cupom, pagamento e revisão do pedido" title="Seu carrinho" />

      {cart.map((item) => {
        const addOnsTotal = item.selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
        return (
          <View key={item.id} style={[styles.card, { backgroundColor: palette.card }]}>
            <Text style={[styles.name, { color: palette.text }]}>{item.product.name}</Text>
            <Text style={[styles.meta, { color: palette.muted }]}>
              {item.selectedSize.name} • {item.selectedAddOns.map((addOn) => addOn.name).join(", ") || "Sem adicionais"}
            </Text>
            <Text style={[styles.meta, { color: palette.text }]}>
              {formatCurrency((item.selectedSize.price + addOnsTotal) * item.quantity)}
            </Text>
            <View style={styles.row}>
              <View style={styles.quantity}>
                <Pressable onPress={() => updateCartItemQuantity(item.id, -1)}>
                  <Text style={[styles.quantityText, { color: palette.text }]}>-</Text>
                </Pressable>
                <Text style={[styles.quantityText, { color: palette.text }]}>{item.quantity}</Text>
                <Pressable onPress={() => updateCartItemQuantity(item.id, 1)}>
                  <Text style={[styles.quantityText, { color: palette.text }]}>+</Text>
                </Pressable>
              </View>
              <Pressable onPress={() => removeCartItem(item.id)}>
                <Text style={[styles.removeText, { color: palette.danger }]}>Remover</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      <TextInput
        onChangeText={setCouponCode}
        placeholder="Cupom de desconto"
        placeholderTextColor={palette.muted}
        style={[styles.input, { backgroundColor: palette.card, color: palette.text }]}
        value={couponCode}
      />

      <View style={styles.paymentRow}>
        {(["PIX", "CARD", "CASH"] as const).map((method) => (
          <Pressable
            key={method}
            onPress={() => setPaymentMethod(method)}
            style={[styles.paymentChip, { backgroundColor: paymentMethod === method ? palette.accent : palette.cardSoft }]}
          >
            <Text style={styles.paymentLabel}>{method}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.summary, { backgroundColor: palette.card }]}>
        <Text style={[styles.summaryText, { color: palette.muted }]}>Subtotal</Text>
        <Text style={[styles.summaryValue, { color: palette.text }]}>{formatCurrency(subtotal)}</Text>
        <Text style={[styles.summaryText, { color: palette.muted }]}>Entrega</Text>
        <Text style={[styles.summaryValue, { color: palette.text }]}>{formatCurrency(6.5)}</Text>
        <Text style={[styles.summaryText, { color: palette.muted }]}>Total estimado</Text>
        <Text style={[styles.totalValue, { color: palette.text }]}>{formatCurrency(subtotal + 6.5)}</Text>
      </View>

      <AppButton onPress={handleCheckout}>Finalizar pedido</AppButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16
  },
  card: {
    borderRadius: 24,
    padding: 18,
    gap: 8
  },
  name: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 16
  },
  meta: {
    fontFamily: "Sora_400Regular",
    fontSize: 13
  },
  row: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  quantity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16
  },
  quantityText: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 18
  },
  removeText: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 13
  },
  input: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontFamily: "Sora_400Regular"
  },
  paymentRow: {
    flexDirection: "row",
    gap: 10
  },
  paymentChip: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center"
  },
  paymentLabel: {
    color: "#fff",
    fontFamily: "Sora_600SemiBold",
    fontSize: 12
  },
  summary: {
    borderRadius: 26,
    padding: 20,
    gap: 10
  },
  summaryText: {
    fontFamily: "Sora_400Regular",
    fontSize: 13
  },
  summaryValue: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 15
  },
  totalValue: {
    fontFamily: "Sora_700Bold",
    fontSize: 22
  }
});
