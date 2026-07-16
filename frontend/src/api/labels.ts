export const BRIGHTNESS_LABELS: Record<string, string> = {
  Dark: "Темно",
  Dim: "Тускло",
  "Normal brightness": "Обычное освещение",
  Bright: "Ярко",
  "Very bright": "Очень ярко",
};

export const NOISE_LABELS: Record<string, string> = {
  "Very quiet": "Очень тихо",
  Quiet: "Тихо",
  "Mild noise": "Умеренный шум",
  Noisy: "Шумно",
  "Very noisy": "Очень шумно",
};

export function brightnessLabel(value: string | null): string {
  if (!value) return "—";
  return BRIGHTNESS_LABELS[value] ?? value;
}

export function noiseLabel(value: string | null): string {
  if (!value) return "—";
  return NOISE_LABELS[value] ?? value;
}

export type Tone = "good" | "warn" | "bad";

const TEMPERATURE_TONE: Record<string, Tone> = {
  "Очень холодно": "bad",
  Холодно: "warn",
  Комфортно: "good",
  Жарко: "warn",
  "Очень жарко": "bad",
};

export function temperatureTone(label: string | null): Tone {
  if (!label) return "warn";
  return TEMPERATURE_TONE[label] ?? "warn";
}
