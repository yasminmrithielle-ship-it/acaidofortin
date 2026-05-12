import { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useAppTheme } from "../theme/theme";

type Props = PropsWithChildren<{
  onPress: () => void;
  variant?: "primary" | "ghost";
}>;

export function AppButton({ children, onPress, variant = "primary" }: Props) {
  const { palette } = useAppTheme();

  if (variant === "ghost") {
    return (
      <Pressable onPress={onPress} style={[styles.button, { backgroundColor: palette.cardSoft }]}>
        <Text style={[styles.label, { color: palette.text }]}>{children}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={styles.button}>
      <LinearGradient colors={[palette.accent, palette.accentNeon]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
        <Text style={styles.label}>{children}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 18,
    overflow: "hidden"
  },
  gradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 16
  },
  label: {
    color: "#fff",
    fontFamily: "Sora_600SemiBold",
    fontSize: 15
  }
});

