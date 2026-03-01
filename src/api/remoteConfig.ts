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
  { key: "doa", label: "Doa Harian", icon: "book", enabled: true, route: "DoaList" },
  { key: "tajwid", label: "Tajwid", icon: "library-outline", enabled: true, route: "Tajwid" },
  { key: "tasbih", label: "Tasbih", icon: "ellipse-outline", enabled: false }
];

export const getFeatureConfig = async (): Promise<FeatureConfig[]> => {
  try {
    const res = await fetch(REMOTE_CONFIG_URL);
    if (!res.ok) throw new Error(`Feature config failed: ${res.status}`);
    const json = (await res.json()) as FeatureConfig[] | { features: FeatureConfig[] };
    let features: FeatureConfig[] = [];
    if (Array.isArray(json)) features = json;
    else if (Array.isArray((json as any).features)) features = (json as any).features;
    else throw new Error("Unexpected feature config payload");

    // Inject Tajwid if not present
    if (!features.some((f) => f.key === "tajwid")) {
      features.splice(1, 0, { key: "tajwid", label: "Tajwid", icon: "library-outline", enabled: true, route: "Tajwid" });
    }

    // Force rename and reroute "hadis" to "Doa Harian" locally to override remote cache
    const doaIndex = features.findIndex((f) => f.key === "hadis" || f.key === "doa");
    if (doaIndex >= 0) {
      features[doaIndex] = { ...features[doaIndex], key: "doa", label: "Doa & Dzikir", icon: "book", route: "DoaList" };
    }

    // Completely remove Kiblat from any fetched JSON response to fulfill user request
    features = features.filter((f) => f.key !== "kiblat");

    return features;
  } catch (err) {
    // graceful fallback
    return FALLBACK_FEATURES;
  }
};

export const getFallbackFeatures = () => FALLBACK_FEATURES;

