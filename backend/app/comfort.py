"""Comfort scoring rules. Thresholds are our own defaults, documented in README.md."""

TEMP_VERY_COLD = 16.0
TEMP_COLD = 20.0
TEMP_COMFORT_HIGH = 25.0
TEMP_HOT = 30.0

TEMP_COMFORT_LOW = TEMP_COLD  # kept as an alias for comfort_score's penalty formula

NOISE_PENALTY = {"Very quiet": 0, "Quiet": 0, "Mild noise": 8, "Noisy": 22, "Very noisy": 30}
BRIGHTNESS_PENALTY = {
    "Dark": 15,
    "Dim": 5,
    "Normal brightness": 0,
    "Bright": 5,
    "Very bright": 15,
}

# Same 5-level shape as the brightness/noise categories the sensors publish.
TEMPERATURE_LEVELS = ("Очень холодно", "Холодно", "Комфортно", "Жарко", "Очень жарко")


def temperature_label(temperature: float) -> str:
    if temperature < TEMP_VERY_COLD:
        return "Очень холодно"
    if temperature < TEMP_COLD:
        return "Холодно"
    if temperature < TEMP_COMFORT_HIGH:
        return "Комфортно"
    if temperature < TEMP_HOT:
        return "Жарко"
    return "Очень жарко"


def comfort_score(temperature: float, noise: str | None, brightness: str | None) -> float:
    temp_penalty = 0.0
    if temperature < TEMP_COMFORT_LOW:
        temp_penalty = (TEMP_COMFORT_LOW - temperature) * 5
    elif temperature > TEMP_COMFORT_HIGH:
        temp_penalty = (temperature - TEMP_COMFORT_HIGH) * 6

    noise_penalty = NOISE_PENALTY.get(noise, 5) if noise else 0
    brightness_penalty = BRIGHTNESS_PENALTY.get(brightness, 0) if brightness else 0

    score = 100 - temp_penalty - noise_penalty - brightness_penalty
    return round(max(0.0, min(100.0, score)), 1)


def status_label(temperature: float, noise: str | None, brightness: str | None) -> str:
    temp_level = temperature_label(temperature)
    if temp_level != "Комфортно":
        return temp_level
    if noise in ("Noisy", "Very noisy"):
        return "Шумно"
    if brightness == "Dark":
        return "Темно"

    score = comfort_score(temperature, noise, brightness)
    if score >= 75:
        if noise in ("Very quiet", "Quiet", "Mild noise"):
            return "Подходит для учёбы"
        return "Комфортно"
    if score >= 55:
        return "Комфортно"
    return "Лучше выбрать другое место"


def is_uncomfortable(temperature: float, noise: str | None, brightness: str | None) -> bool:
    return comfort_score(temperature, noise, brightness) < 55
