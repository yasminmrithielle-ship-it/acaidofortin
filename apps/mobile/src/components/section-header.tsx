import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../theme/theme";

type Props = {
  title: string;
  subtitle?: string;
};

export function SectionHeader({ title, subtitle }: Props) {
  const { palette } = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: palette.muted }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6
  },
  title: {
    fontFamily: "Sora_700Bold",
    fontSize: 20
  },
  subtitle: {
    fontFamily: "Sora_400Regular",
    fontSize: 13
  }
});

