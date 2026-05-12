import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../theme/theme";

const steps = ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];

type Props = {
  status: string;
};

export function StatusStepper({ status }: Props) {
  const { palette } = useAppTheme();
  const activeIndex = Math.max(steps.indexOf(status), 0);

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const active = index <= activeIndex;
        return (
          <View style={styles.step} key={step}>
            <View style={[styles.dot, { backgroundColor: active ? palette.accentNeon : palette.cardSoft }]} />
            <Text style={[styles.label, { color: active ? palette.text : palette.muted }]}>{step.replaceAll("_", " ")}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 999
  },
  label: {
    fontFamily: "Sora_400Regular",
    fontSize: 12
  }
});

