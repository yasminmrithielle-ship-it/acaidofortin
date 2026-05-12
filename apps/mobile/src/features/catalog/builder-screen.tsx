import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton } from "../../components/app-button";
import { useApp } from "../../store/app-context";
import { useAppTheme } from "../../theme/theme";
import { Product, ProductOption } from "../../types/app";
import { formatCurrency } from "../../utils/currency";

type Props = {
  product: Product;
  onBack: () => void;
};

export function BuilderScreen({ product, onBack }: Props) {
  const { addToCart } = useApp();
  const { palette } = useAppTheme();
  const [selectedSize, setSelectedSize] = useState<ProductOption>(product.sizes[0]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const selectedAddOns = useMemo(
    () => product.addOns.filter((addOn) => selectedIds.includes(addOn.id)),
    [product.addOns, selectedIds]
  );

  const total = useMemo(() => {
    const addOnsTotal = selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
    return (selectedSize.price + addOnsTotal) * quantity;
  }, [quantity, selectedAddOns, selectedSize.price]);
  const imageSource = product.imageAsset ?? (product.imageUrl ? { uri: product.imageUrl } : undefined);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Pressable onPress={onBack}>
        <Text style={[styles.back, { color: palette.accentNeon }]}>Voltar</Text>
      </Pressable>

      {imageSource ? <Image source={imageSource} style={styles.image} /> : null}

      <Text style={[styles.name, { color: palette.text }]}>{product.name}</Text>
      <Text style={[styles.description, { color: palette.muted }]}>{product.description}</Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Escolha o tamanho</Text>
        <View style={styles.optionsWrap}>
          {product.sizes.map((size) => (
            <Pressable
              key={size.id}
              onPress={() => setSelectedSize(size)}
              style={[styles.option, { backgroundColor: selectedSize.id === size.id ? palette.accent : palette.cardSoft }]}
            >
              <Text style={styles.optionLabel}>
                {size.name} • {formatCurrency(size.price)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Adicionais</Text>
        <View style={styles.optionsWrap}>
          {product.addOns.map((addOn) => {
            const active = selectedIds.includes(addOn.id);
            return (
              <Pressable
                key={addOn.id}
                onPress={() =>
                  setSelectedIds((current) =>
                    current.includes(addOn.id) ? current.filter((item) => item !== addOn.id) : [...current, addOn.id]
                  )
                }
                style={[styles.option, { backgroundColor: active ? palette.accent : palette.cardSoft }]}
              >
                <Text style={styles.optionLabel}>
                  {addOn.name} • {formatCurrency(addOn.price)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Observações</Text>
        <TextInput
          multiline
          onChangeText={setNotes}
          placeholder="Ex.: pouco leite em pó, colher extra..."
          placeholderTextColor={palette.muted}
          style={[styles.notes, { backgroundColor: palette.card, color: palette.text }]}
          value={notes}
        />
      </View>

      <View style={[styles.quantityRow, { backgroundColor: palette.card }]}>
        <Pressable onPress={() => setQuantity((current) => Math.max(1, current - 1))}>
          <Text style={[styles.quantityButton, { color: palette.text }]}>-</Text>
        </Pressable>
        <Text style={[styles.quantityValue, { color: palette.text }]}>{quantity}</Text>
        <Pressable onPress={() => setQuantity((current) => current + 1)}>
          <Text style={[styles.quantityButton, { color: palette.text }]}>+</Text>
        </Pressable>
      </View>

      <AppButton
        onPress={() => {
          addToCart(product, selectedSize, selectedAddOns, quantity, notes);
          onBack();
        }}
      >
        Adicionar por {formatCurrency(total)}
      </AppButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 18
  },
  back: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 14
  },
  image: {
    width: "100%",
    height: 260,
    borderRadius: 28
  },
  name: {
    fontFamily: "Sora_700Bold",
    fontSize: 28
  },
  description: {
    fontFamily: "Sora_400Regular",
    fontSize: 14,
    lineHeight: 22
  },
  section: {
    gap: 10
  },
  sectionTitle: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 16
  },
  optionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  option: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  optionLabel: {
    color: "#fff",
    fontFamily: "Sora_600SemiBold",
    fontSize: 12
  },
  notes: {
    minHeight: 96,
    borderRadius: 22,
    padding: 16,
    textAlignVertical: "top",
    fontFamily: "Sora_400Regular"
  },
  quantityRow: {
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  quantityButton: {
    fontFamily: "Sora_700Bold",
    fontSize: 24
  },
  quantityValue: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 18
  }
});
