export type FeatureConfig = {
  key: string;
  label: string;
  icon: string;
  enabled: boolean;
  route?: string;
};

// Hosted static JSON; replace with your own repo when available.
const REMOTE_CONFIG_URL =
  "https://raw.githubusercontent.com/tilamanbelajarquran/remote-config/main/features.json";

const FALLBACK_FEATURES: FeatureConfig[] = [
  { key: "kiblat", label: "Kiblat", icon: "navigate", enabled: true, route: "Imsakiyah" },
  { key: "hadis", label: "Hadis", icon: "book", enabled: true, route: "Search" },
  { key: "tasbih", label: "Tasbih", icon: "ellipse-outline", enabled: false }
];

export const getFeatureConfig = async (): Promise<FeatureConfig[]> => {
  try {
    const res = await fetch(REMOTE_CONFIG_URL);
    if (!res.ok) throw new Error(`Feature config failed: ${res.status}`);
    const json = (await res.json()) as FeatureConfig[] | { features: FeatureConfig[] };
    if (Array.isArray(json)) return json;
    if (Array.isArray((json as any).features)) return (json as any).features;
    throw new Error("Unexpected feature config payload");
  } catch (err) {
    // graceful fallback
    return FALLBACK_FEATURES;
  }
};

export const getFallbackFeatures = () => FALLBACK_FEATURES;

