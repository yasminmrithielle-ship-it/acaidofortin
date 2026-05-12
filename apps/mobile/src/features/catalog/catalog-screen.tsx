import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from "react-native";

import { ProductCard } from "../../components/product-card";
import { SectionHeader } from "../../components/section-header";
import { useApp } from "../../store/app-context";
import { useAppTheme } from "../../theme/theme";
import { Product } from "../../types/app";

type Props = {
  onOpenProduct: (product: Product) => void;
};

export function CatalogScreen({ onOpenProduct }: Props) {
  const { catalog } = useApp();
  const { palette } = useAppTheme();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");

  const filteredProducts = useMemo(() => {
    return catalog.products.filter((product) => {
      const matchesCategory = categoryId === "all" || product.categoryId === categoryId;
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description?.toLowerCase().includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [catalog.products, categoryId, search]);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <SectionHeader subtitle="Pesquise, filtre e personalize" title="Catálogo premium" />

      <TextInput
        onChangeText={setSearch}
        placeholder="Buscar sabores, cremes e toppings"
        placeholderTextColor={palette.muted}
        style={[styles.searchInput, { backgroundColor: palette.card, color: palette.text }]}
        value={search}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chipsRow}>
          <Pressable onPress={() => setCategoryId("all")} style={[styles.chip, { backgroundColor: categoryId === "all" ? palette.accent : palette.cardSoft }]}>
            <Text style={styles.chipLabel}>Todos</Text>
          </Pressable>
          {catalog.categories.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => setCategoryId(category.id)}
              style={[styles.chip, { backgroundColor: categoryId === category.id ? palette.accent : palette.cardSoft }]}
            >
              <Text style={styles.chipLabel}>{category.name}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {filteredProducts.map((product) => (
        <ProductCard
          key={product.id}
          onPress={() => onOpenProduct(product)}
          product={product}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16
  },
  searchInput: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontFamily: "Sora_400Regular"
  },
  chipsRow: {
    flexDirection: "row",
    gap: 10
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999
  },
  chipLabel: {
    color: "#fff",
    fontFamily: "Sora_600SemiBold",
    fontSize: 12
  }
});
