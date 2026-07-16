import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { brightnessLabel, noiseLabel, temperatureTone } from "../api/labels";
import type { CurrentStatus } from "../api/types";
import { Loading, ErrorView } from "../components/StateViews";
import Mascot from "../components/Mascot";
import { computeMascotMood } from "../mascot/mood";
import { useToast } from "../context/ToastContext";
import atriumHero from "../assets/atrium-hero.jpg";

function statusTone(score: number | null): "good" | "warn" | "bad" {
  if (score === null) return "warn";
  if (score >= 75) return "good";
  if (score >= 55) return "warn";
  return "bad";
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CurrentStatusPage() {
  const { notify } = useToast();
  const [status, setStatus] = useState<CurrentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .getCurrentStatus()
      .then(setStatus)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Не удалось загрузить данные"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const result = await api.refreshData();
      if (result.added > 0) {
        notify(`Добавлено новых показаний: ${result.added}`);
      } else {
        notify("Новых данных пока нет — канал ещё не публиковал свежих показаний");
      }
      await api.getCurrentStatus().then(setStatus);
    } catch (e) {
      notify(e instanceof ApiError ? e.message : "Не удалось обновить данные", "error");
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) return <Loading label="Загружаем текущее состояние атриума..." />;
  if (error) return <ErrorView message={error} onRetry={load} />;

  if (!status || status.last_measured_at === null) {
    return (
      <div className="home-hero-wrap">
        <section className="hero">
          <img src={atriumHero} className="hero-img" alt="Атриум Nazarbayev University" />
          <div className="hero-overlay">
            <span className="hero-eyebrow">Nazarbayev University · Атриум</span>
            <h1 className="hero-title">Атриум сейчас</h1>
            <p className="hero-empty">Пока нет измерений в базе.</p>
            <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? "Обновляем..." : "🔄 Обновить данные"}
            </button>
          </div>
        </section>
      </div>
    );
  }

  const tone = statusTone(status.comfort_score);
  const mood = computeMascotMood({
    atriumTemperature: status.atrium_temperature,
    noise: status.noise,
  });

  return (
    <div className="home-hero-wrap">
      <section className="hero">
        <img src={atriumHero} className="hero-img" alt="Атриум Nazarbayev University" />

        <div className="hero-spacer-top" />
        <div className="hero-mascot">
          <Mascot mood={mood} />
        </div>
        <div className="hero-spacer-bottom" />

        <div className="hero-overlay">
          <span className="hero-eyebrow">Nazarbayev University · Атриум</span>
          <h1 className="hero-title">Атриум сейчас</h1>

          <div className={`hero-status-pill tone-${tone}`}>
            <span>{status.status_label}</span>
            {status.comfort_score !== null && (
              <span className="hero-status-score">{status.comfort_score}/100</span>
            )}
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-label">Температура в атриуме</span>
              <span className="hero-stat-value">
                {status.atrium_temperature !== null ? `${status.atrium_temperature}°C` : "—"}
              </span>
              {status.atrium_temperature_label && (
                <span className={`temp-badge tone-${temperatureTone(status.atrium_temperature_label)}`}>
                  {status.atrium_temperature_label}
                </span>
              )}
            </div>
            <div className="hero-stat">
              <span className="hero-stat-label">Температура на улице</span>
              <span className="hero-stat-value">
                {status.outside_temperature !== null ? `${status.outside_temperature}°C` : "—"}
              </span>
              {status.outside_temperature_label && (
                <span className={`temp-badge tone-${temperatureTone(status.outside_temperature_label)}`}>
                  {status.outside_temperature_label}
                </span>
              )}
            </div>
            <div className="hero-stat">
              <span className="hero-stat-label">Освещение</span>
              <span className="hero-stat-value hero-stat-value-text">{brightnessLabel(status.brightness)}</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-label">Шум</span>
              <span className="hero-stat-value hero-stat-value-text">{noiseLabel(status.noise)}</span>
            </div>
          </div>

          <div className="hero-footer-row">
            <p className="hero-updated">Последнее измерение: {formatDateTime(status.last_measured_at)}</p>
            <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? "Обновляем..." : "🔄 Обновить данные"}
            </button>
          </div>
        </div>
      </section>

      <div className="page home-below-fold">
        <nav className="quick-links">
          <Link to="/history" className="quick-link-card">
            <span className="quick-link-icon">📊</span>
            <span className="quick-link-title">История измерений</span>
            <span className="quick-link-desc">Фильтры по дате, месту, шуму и сортировка</span>
          </Link>
          <Link to="/analytics" className="quick-link-card">
            <span className="quick-link-icon">📈</span>
            <span className="quick-link-title">Аналитика</span>
            <span className="quick-link-desc">Мин/макс/средняя температура и график по дню</span>
          </Link>
          <Link to="/reports" className="quick-link-card">
            <span className="quick-link-icon">📝</span>
            <span className="quick-link-title">Оставить отзыв</span>
            <span className="quick-link-desc">Слишком жарко, шумно, ярко или комфортно?</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
