import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../theme/theme";
import { Product } from "../types/app";
import { formatCurrency } from "../utils/currency";

type Props = {
  product: Product;
  onPress: () => void;
};

export function ProductCard({ product, onPress }: Props) {
  const { palette } = useAppTheme();
  const source = product.imageAsset ?? (product.imageUrl ? { uri: product.imageUrl } : undefined);

  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      {source ? <Image source={source} style={styles.image} /> : null}
      <View style={styles.content}>
        <View style={styles.row}>
          <Text numberOfLines={1} style={[styles.name, { color: palette.text }]}>
            {product.name}
          </Text>
        </View>
        <Text numberOfLines={2} style={[styles.description, { color: palette.muted }]}>
          {product.description}
        </Text>
        <View style={styles.row}>
          <Text style={[styles.price, { color: palette.text }]}>{formatCurrency(product.basePrice)}</Text>
          <View style={[styles.badge, { backgroundColor: palette.cardSoft }]}>
            <Text style={[styles.badgeLabel, { color: palette.text }]}>{product.stockQuantity} em estoque</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 16
  },
  image: {
    width: "100%",
    height: 160
  },
  content: {
    padding: 16,
    gap: 10
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  name: {
    flex: 1,
    fontFamily: "Sora_600SemiBold",
    fontSize: 16
  },
  description: {
    fontFamily: "Sora_400Regular",
    fontSize: 13,
    lineHeight: 20
  },
  price: {
    fontFamily: "Sora_700Bold",
    fontSize: 16
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  badgeLabel: {
    fontFamily: "Sora_400Regular",
    fontSize: 11
  }
});
