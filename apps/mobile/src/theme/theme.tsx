import { PropsWithChildren, createContext, useContext, useMemo } from "react";
import { ColorSchemeName, useColorScheme } from "react-native";
import { DefaultTheme, Theme, DarkTheme } from "@react-navigation/native";

import { palettes } from "./colors";

export type AppPalette = typeof palettes.dark;

type ThemeContextValue = {
  palette: AppPalette;
  navigationTheme: Theme;
  scheme: "dark" | "light";
};

const ThemeContext = createContext<ThemeContextValue>({
  palette: palettes.dark,
  navigationTheme: DarkTheme,
  scheme: "dark"
});

function buildNavigationTheme(scheme: "dark" | "light", palette: AppPalette): Theme {
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      background: palette.background,
      card: palette.card,
      primary: palette.accent,
      text: palette.text,
      border: palette.border,
      notification: palette.accentNeon
    }
  };
}

export function AppThemeProvider({ children }: PropsWithChildren) {
  const systemScheme: ColorSchemeName = useColorScheme();
  const scheme: "dark" | "light" = systemScheme === "light" ? "light" : "dark";

  const value = useMemo(() => {
    const palette = palettes[scheme];
    return {
      palette,
      scheme,
      navigationTheme: buildNavigationTheme(scheme, palette)
    };
  }, [scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
