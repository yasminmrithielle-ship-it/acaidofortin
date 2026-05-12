import { Alert, Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useRef } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { ProductCard } from "../../components/product-card";
import { PromoBanner } from "../../components/promo-banner";
import { SectionHeader } from "../../components/section-header";
import { useApp } from "../../store/app-context";
import { fortinLogo } from "../../theme/brand-assets";
import { useAppTheme } from "../../theme/theme";
import { Product } from "../../types/app";

type Props = {
  onOpenProduct: (product: Product) => void;
};

export function HomeScreen({ onOpenProduct }: Props) {
  const { catalog, locationLabel, requestLocation, openWhatsApp } = useApp();
  const { palette } = useAppTheme();
  const entrance = useRef(new Animated.Value(0)).current;
  const featured = catalog.products.filter((product) => product.isFeatured);
  const coupons = catalog.coupons ?? [];
  const couponMessage = coupons.length
    ? coupons.map((coupon) => `${coupon.code}: ${coupon.description ?? "Cupom ativo"}`).join("\n")
    : "Use FORTIN10 no carrinho para aplicar desconto.";

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true
    }).start();
  }, [entrance]);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Animated.View
        style={{
          opacity: entrance,
          transform: [
            {
              translateY: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0]
              })
            }
          ]
        }}
      >
        <View style={[styles.hero, { backgroundColor: palette.card }]}>
          <Image source={fortinLogo} style={styles.logo} />
          <Text style={[styles.eyebrow, { color: palette.accentNeon }]}>AÇAÍ ARTESANAL PREMIUM</Text>
          <Text style={[styles.heroTitle, { color: palette.text }]}>Seu bowl perfeito, do seu jeito, entregue rápido.</Text>
          <Pressable onPress={requestLocation} style={[styles.locationChip, { backgroundColor: palette.cardSoft }]}>
            <MaterialCommunityIcons color={palette.accentNeon} name="map-marker-radius" size={18} />
            <Text style={[styles.locationLabel, { color: palette.text }]}>{locationLabel}</Text>
          </Pressable>
        </View>
      </Animated.View>

      <View style={styles.sectionGap}>
        <SectionHeader subtitle="Combos, promoções e ativações da semana" title="Destaques Fortin" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.bannerRow}>
            {catalog.banners.map((banner) => (
              <PromoBanner banner={banner} key={banner.id} />
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.quickActions}>
        <Pressable onPress={openWhatsApp} style={[styles.quickAction, { backgroundColor: palette.card }]}>
          <MaterialCommunityIcons color={palette.accentNeon} name="whatsapp" size={22} />
          <Text style={[styles.quickActionLabel, { color: palette.text }]}>Chat e suporte</Text>
        </Pressable>
        <Pressable
          onPress={() => Alert.alert("Cupons disponiveis", couponMessage)}
          style={[styles.quickAction, { backgroundColor: palette.card }]}
        >
          <MaterialCommunityIcons color={palette.accentNeon} name="ticket-percent-outline" size={22} />
          <Text style={[styles.quickActionLabel, { color: palette.text }]}>Cupons e promoções</Text>
        </Pressable>
      </View>

      <View style={styles.sectionGap}>
        <SectionHeader subtitle="Monte o bowl com tamanhos e adicionais" title="Mais pedidos" />
        {featured.map((product) => (
          <ProductCard
            key={product.id}
            onPress={() => onOpenProduct(product)}
            product={product}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 20
  },
  hero: {
    borderRadius: 30,
    padding: 22,
    gap: 16
  },
  logo: {
    width: 132,
    height: 104,
    resizeMode: "contain",
    alignSelf: "flex-start",
    borderRadius: 18
  },
  eyebrow: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 12,
    letterSpacing: 1.4
  },
  heroTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 28,
    lineHeight: 38
  },
  locationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999
  },
  locationLabel: {
    fontFamily: "Sora_400Regular",
    fontSize: 12
  },
  sectionGap: {
    gap: 14
  },
  bannerRow: {
    flexDirection: "row",
    gap: 14
  },
  quickActions: {
    flexDirection: "row",
    gap: 14
  },
  quickAction: {
    flex: 1,
    borderRadius: 24,
    padding: 18,
    gap: 10
  },
  quickActionLabel: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 14
  }
});
