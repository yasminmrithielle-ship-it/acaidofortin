import { ImageBackground, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { BannerItem } from "../types/app";

type Props = {
  banner: BannerItem;
};

export function PromoBanner({ banner }: Props) {
  const source = banner.imageAsset ?? { uri: banner.imageUrl };

  return (
    <ImageBackground source={source} style={styles.background} imageStyle={styles.image}>
      <LinearGradient colors={["rgba(0,0,0,0.15)", "rgba(11,7,19,0.88)"]} style={styles.overlay}>
        <Text style={styles.title}>{banner.title}</Text>
        {banner.subtitle ? <Text style={styles.subtitle}>{banner.subtitle}</Text> : null}
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>{banner.ctaLabel ?? "Explorar"}</Text>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    width: 300,
    height: 190
  },
  image: {
    borderRadius: 28
  },
  overlay: {
    flex: 1,
    borderRadius: 28,
    padding: 20,
    justifyContent: "flex-end",
    gap: 8
  },
  title: {
    color: "#fff",
    fontFamily: "Sora_700Bold",
    fontSize: 24
  },
  subtitle: {
    color: "rgba(255,255,255,0.88)",
    fontFamily: "Sora_400Regular",
    fontSize: 13,
    lineHeight: 20
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)"
  },
  badgeLabel: {
    color: "#fff",
    fontFamily: "Sora_600SemiBold",
    fontSize: 12
  }
});
