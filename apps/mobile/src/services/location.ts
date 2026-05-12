import * as Location from "expo-location";

export async function getCurrentLocationLabel() {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== "granted") {
    return "Localização indisponível";
  }

  const current = await Location.getCurrentPositionAsync({});
  const address = await Location.reverseGeocodeAsync(current.coords);
  const primary = address[0];

  if (!primary) {
    return `${current.coords.latitude.toFixed(3)}, ${current.coords.longitude.toFixed(3)}`;
  }

  return `${primary.district ?? primary.street ?? "Entrega rápida"} • ${primary.city ?? "sua região"}`;
}

