import "react-native-gesture-handler";

import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Sora_400Regular, Sora_600SemiBold, Sora_700Bold } from "@expo-google-fonts/sora";

import { RootNavigator } from "./src/navigation";
import { AppProvider } from "./src/store/app-context";
import { AppThemeProvider, useAppTheme } from "./src/theme/theme";

void SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { scheme } = useAppTheme();
  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_600SemiBold,
    Sora_700Bold
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

