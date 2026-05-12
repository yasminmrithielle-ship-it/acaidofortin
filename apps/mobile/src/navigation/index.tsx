import { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CartScreen } from "../features/cart/cart-screen";
import { BuilderScreen } from "../features/catalog/builder-screen";
import { CatalogScreen } from "../features/catalog/catalog-screen";
import { HomeScreen } from "../features/home/home-screen";
import { OrdersScreen } from "../features/orders/orders-screen";
import { useApp } from "../store/app-context";
import { fortinLogo } from "../theme/brand-assets";
import { useAppTheme } from "../theme/theme";
import { Product } from "../types/app";

const Stack = createNativeStackNavigator<any>();

type ScreenKey = "home" | "catalog" | "cart" | "orders";

const menuItems: Array<{ key: ScreenKey; label: string; icon: string }> = [
  { key: "home", label: "Inicio", icon: "home-variant-outline" },
  { key: "catalog", label: "Cardapio", icon: "silverware-fork-knife" },
  { key: "cart", label: "Carrinho", icon: "cart-outline" },
  { key: "orders", label: "Pedidos", icon: "motorbike" }
];

function OrderAppShell({ onOpenProduct }: { onOpenProduct: (product: Product) => void }) {
  const { palette } = useAppTheme();
  const { openWhatsApp } = useApp();
  const [currentScreen, setCurrentScreen] = useState<ScreenKey>("home");
  const [menuOpen, setMenuOpen] = useState(false);

  function navigate(screen: ScreenKey) {
    setCurrentScreen(screen);
    setMenuOpen(false);
  }

  function renderScreen() {
    if (currentScreen === "catalog") return <CatalogScreen onOpenProduct={onOpenProduct} />;
    if (currentScreen === "cart") return <CartScreen />;
    if (currentScreen === "orders") return <OrdersScreen />;
    return <HomeScreen onOpenProduct={onOpenProduct} />;
  }

  return (
    <SafeAreaView style={[styles.shell, { backgroundColor: palette.background }]}>
      <View style={[styles.header, { borderBottomColor: palette.border }]}>
        <View style={styles.brandRow}>
          <Image source={fortinLogo} style={styles.logo} />
          <View>
            <Text style={[styles.brandName, { color: palette.text }]}>Acai do Fortin</Text>
            <Text style={[styles.brandMeta, { color: palette.muted }]}>Pedido rapido e entrega</Text>
          </View>
        </View>
        <Pressable onPress={() => setMenuOpen(true)} style={[styles.menuButton, { backgroundColor: palette.card }]}>
          <MaterialCommunityIcons color={palette.accentNeon} name="menu" size={24} />
        </Pressable>
      </View>

      <View style={styles.screen}>{renderScreen()}</View>

      <Modal animationType="fade" onRequestClose={() => setMenuOpen(false)} transparent visible={menuOpen}>
        <Pressable onPress={() => setMenuOpen(false)} style={styles.backdrop} />
        <View style={[styles.drawer, { backgroundColor: palette.card, borderLeftColor: palette.border }]}>
          <View style={styles.drawerHead}>
            <Image source={fortinLogo} style={styles.drawerLogo} />
            <Pressable onPress={() => setMenuOpen(false)} style={[styles.menuButton, { backgroundColor: palette.cardSoft }]}>
              <MaterialCommunityIcons color={palette.text} name="close" size={22} />
            </Pressable>
          </View>
          {menuItems.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => navigate(item.key)}
              style={[styles.drawerItem, { backgroundColor: currentScreen === item.key ? palette.accent : palette.cardSoft }]}
            >
              <MaterialCommunityIcons color="#fff" name={item.icon as any} size={20} />
              <Text style={styles.drawerLabel}>{item.label}</Text>
            </Pressable>
          ))}
          <Pressable onPress={openWhatsApp} style={[styles.drawerItem, { backgroundColor: palette.cardSoft }]}>
            <MaterialCommunityIcons color="#fff" name="whatsapp" size={20} />
            <Text style={styles.drawerLabel}>WhatsApp</Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export function RootNavigator() {
  const { palette, navigationTheme } = useAppTheme();
  const { ready } = useApp();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.background }}>
        <ActivityIndicator color={palette.accentNeon} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main">
          {({ navigation }) => <OrderAppShell onOpenProduct={(product) => navigation.navigate("Builder", { product })} />}
        </Stack.Screen>
        <Stack.Screen name="Builder">
          {({ navigation, route }) => (
            <BuilderScreen onBack={navigation.goBack} product={(route.params as { product: Product }).product} />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1
  },
  header: {
    minHeight: 76,
    borderBottomWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  logo: {
    width: 54,
    height: 48,
    resizeMode: "contain",
    borderRadius: 10,
    backgroundColor: "#fff"
  },
  brandName: {
    fontFamily: "Sora_700Bold",
    fontSize: 16
  },
  brandMeta: {
    fontFamily: "Sora_400Regular",
    fontSize: 12
  },
  menuButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  screen: {
    flex: 1
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.48)"
  },
  drawer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "78%",
    borderLeftWidth: 1,
    padding: 22,
    gap: 12
  },
  drawerHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  drawerLogo: {
    width: 118,
    height: 94,
    resizeMode: "contain",
    borderRadius: 12,
    backgroundColor: "#fff"
  },
  drawerItem: {
    minHeight: 54,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  drawerLabel: {
    color: "#fff",
    fontFamily: "Sora_600SemiBold",
    fontSize: 15
  }
});
