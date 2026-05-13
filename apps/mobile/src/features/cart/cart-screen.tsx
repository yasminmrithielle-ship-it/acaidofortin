import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useMemo, useState } from "react";

import { AppButton } from "../../components/app-button";
import { SectionHeader } from "../../components/section-header";
import { DELIVERY_FEE } from "../../services/api";
import { useApp } from "../../store/app-context";
import { useAppTheme } from "../../theme/theme";
import { DeliveryAddressInput } from "../../types/app";
import { formatCurrency } from "../../utils/currency";

type DeliveryForm = Required<DeliveryAddressInput>;

const defaultDeliveryForm: DeliveryForm = {
  zipCode: "",
  street: "",
  number: "",
  referencePoint: "",
  phone: "",
  neighborhood: "",
  city: "Belo Horizonte",
  state: "MG"
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function getOrderCode(orderId: string, publicCode?: string) {
  return publicCode ?? `FRT-${orderId.slice(-6).toUpperCase()}`;
}

export function CartScreen() {
  const { cart, checkout, removeCartItem, updateCartItemQuantity } = useApp();
  const { palette } = useAppTheme();
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CARD" | "CASH">("PIX");
  const [couponCode, setCouponCode] = useState("");
  const [deliveryForm, setDeliveryForm] = useState<DeliveryForm>(defaultDeliveryForm);
  const [cepStatus, setCepStatus] = useState("");

  const subtotal = useMemo(
    () =>
      cart.reduce((total, item) => {
        const addOnsTotal = item.selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
        return total + (item.selectedSize.price + addOnsTotal) * item.quantity;
      }, 0),
    [cart]
  );

  const total = cart.length ? subtotal + DELIVERY_FEE : 0;

  function updateDeliveryField(field: keyof DeliveryForm, value: string) {
    setDeliveryForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function lookupCep(zipCode: string) {
    const digits = onlyDigits(zipCode);

    if (!digits) {
      setCepStatus("");
      return;
    }

    if (digits.length !== 8) {
      setCepStatus("Informe 8 digitos para buscar o CEP.");
      return;
    }

    setCepStatus("Buscando CEP...");

    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await response.json();

      if (!response.ok || data.erro) {
        setCepStatus("CEP nao encontrado. Preencha o endereco manualmente.");
        return;
      }

      setDeliveryForm((current) => ({
        ...current,
        zipCode: data.cep ?? current.zipCode,
        street: data.logradouro || current.street,
        neighborhood: data.bairro || current.neighborhood,
        city: data.localidade || current.city,
        state: data.uf || current.state
      }));
      setCepStatus("Endereco localizado pelo CEP.");
    } catch {
      setCepStatus("Nao foi possivel consultar o CEP agora.");
    }
  }

  function validateDelivery() {
    const requiredFields: Array<[keyof DeliveryForm, string]> = [
      ["street", "rua"],
      ["number", "numero"],
      ["phone", "telefone"],
      ["neighborhood", "bairro"]
    ];

    const missingField = requiredFields.find(([field]) => !deliveryForm[field].trim());

    if (missingField) {
      Alert.alert("Dados da entrega", `Informe ${missingField[1]} para finalizar.`);
      return false;
    }

    return true;
  }

  async function handleCheckout() {
    if (cart.length === 0) {
      Alert.alert("Carrinho vazio", "Adicione um produto antes de finalizar o pedido.");
      return;
    }

    if (!validateDelivery()) {
      return;
    }

    const order = await checkout(paymentMethod, couponCode.trim(), {
      zipCode: deliveryForm.zipCode.trim() || undefined,
      street: deliveryForm.street.trim(),
      number: deliveryForm.number.trim(),
      referencePoint: deliveryForm.referencePoint.trim() || undefined,
      phone: onlyDigits(deliveryForm.phone),
      neighborhood: deliveryForm.neighborhood.trim(),
      city: deliveryForm.city.trim() || "Belo Horizonte",
      state: deliveryForm.state.trim() || "MG"
    });

    if (!order) return;

    const code = getOrderCode(order.id, order.publicCode);
    setDeliveryForm(defaultDeliveryForm);
    Alert.alert(
      "Pedido enviado",
      `Numero do pedido: ${code}\nOs detalhes e atualizacoes serao enviados no WhatsApp informado.`
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <SectionHeader subtitle="Cupom, pagamento, entrega e revisao" title="Seu carrinho" />

      {cart.map((item) => {
        const addOnsTotal = item.selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
        return (
          <View key={item.id} style={[styles.card, { backgroundColor: palette.card }]}>
            <Text style={[styles.name, { color: palette.text }]}>{item.product.name}</Text>
            <Text style={[styles.meta, { color: palette.muted }]}>
              {item.selectedSize.name} - {item.selectedAddOns.map((addOn) => addOn.name).join(", ") || "Sem adicionais"}
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

      <View style={[styles.formCard, { backgroundColor: palette.card }]}>
        <SectionHeader subtitle="Entrega gratis para bairros em ate 6 km" title="Detalhes da entrega" />
        <TextInput
          keyboardType="numeric"
          onBlur={() => lookupCep(deliveryForm.zipCode)}
          onChangeText={(value) => updateDeliveryField("zipCode", value)}
          placeholder="CEP opcional"
          placeholderTextColor={palette.muted}
          style={[styles.input, { backgroundColor: palette.cardSoft, color: palette.text }]}
          value={deliveryForm.zipCode}
        />
        {cepStatus ? <Text style={[styles.helper, { color: palette.muted }]}>{cepStatus}</Text> : null}
        <TextInput
          onChangeText={(value) => updateDeliveryField("street", value)}
          placeholder="Rua"
          placeholderTextColor={palette.muted}
          style={[styles.input, { backgroundColor: palette.cardSoft, color: palette.text }]}
          value={deliveryForm.street}
        />
        <View style={styles.twoColumns}>
          <TextInput
            onChangeText={(value) => updateDeliveryField("number", value)}
            placeholder="Numero"
            placeholderTextColor={palette.muted}
            style={[styles.input, styles.columnInput, { backgroundColor: palette.cardSoft, color: palette.text }]}
            value={deliveryForm.number}
          />
          <TextInput
            onChangeText={(value) => updateDeliveryField("neighborhood", value)}
            placeholder="Bairro"
            placeholderTextColor={palette.muted}
            style={[styles.input, styles.columnInput, { backgroundColor: palette.cardSoft, color: palette.text }]}
            value={deliveryForm.neighborhood}
          />
        </View>
        <TextInput
          onChangeText={(value) => updateDeliveryField("referencePoint", value)}
          placeholder="Ponto de referencia"
          placeholderTextColor={palette.muted}
          style={[styles.input, { backgroundColor: palette.cardSoft, color: palette.text }]}
          value={deliveryForm.referencePoint}
        />
        <TextInput
          keyboardType="phone-pad"
          onChangeText={(value) => updateDeliveryField("phone", value)}
          placeholder="Telefone com WhatsApp"
          placeholderTextColor={palette.muted}
          style={[styles.input, { backgroundColor: palette.cardSoft, color: palette.text }]}
          value={deliveryForm.phone}
        />
      </View>

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
        <Text style={[styles.summaryValue, { color: palette.text }]}>Gratis ate 6 km</Text>
        <Text style={[styles.summaryText, { color: palette.muted }]}>Total estimado</Text>
        <Text style={[styles.totalValue, { color: palette.text }]}>{formatCurrency(total)}</Text>
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
  formCard: {
    borderRadius: 26,
    padding: 18,
    gap: 10
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
  helper: {
    fontFamily: "Sora_400Regular",
    fontSize: 12
  },
  twoColumns: {
    flexDirection: "row",
    gap: 10
  },
  columnInput: {
    flex: 1
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
