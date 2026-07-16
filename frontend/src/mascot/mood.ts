import happyImg from "../assets/mascot/happy.png";
import coldImg from "../assets/mascot/cold.png";
import hotImg from "../assets/mascot/hot.png";
import noisyImg from "../assets/mascot/noisy.png";

export type MascotMood = "happy" | "cold" | "hot" | "noisy";

export function computeMascotMood(params: {
  atriumTemperature: number | null;
  noise: string | null;
}): MascotMood {
  const { atriumTemperature, noise } = params;

  if (atriumTemperature !== null) {
    if (atriumTemperature < 19) return "cold";
    if (atriumTemperature > 24) return "hot";
  }
  if (noise === "Noisy" || noise === "Very noisy") return "noisy";
  return "happy";
}

export const MASCOT_PHRASES: Record<MascotMood, string> = {
  happy: "Міне, сұлулық! Атриум сегодня идеальный.",
  cold: "Бауырым, куртку накинь. Здесь не Северный полюс.",
  hot: "Уф... Тут уже хаммам. Остудите Атриум.",
  noisy: "Эй, бауырлар! Потише, люди учатся.",
};

export const MASCOT_IMAGES: Record<MascotMood, string> = {
  happy: happyImg,
  cold: coldImg,
  hot: hotImg,
  noisy: noisyImg,
};

export const MASCOT_LABELS: Record<MascotMood, string> = {
  happy: "Happy",
  cold: "Cold",
  hot: "Hot",
  noisy: "Noisy",
};

export const MASCOT_PARTICLES: Record<MascotMood, string[]> = {
  happy: ["✨", "⭐", "👍"],
  cold: ["❄️", "💨"],
  hot: ["💧", "💦"],
  noisy: ["❗", "🔇"],
};
