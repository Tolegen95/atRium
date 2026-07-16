import { useCallback, useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { api, ApiError } from "../api/client";
import type { Reading, Summary } from "../api/types";
import { EmptyView, ErrorView, Loading } from "../components/StateViews";

export default function AnalyticsPage() {
  // Empty date means "let the backend pick the most recent day with data".
  const [date, setDate] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .getSummary(date || undefined)
      .then((s) => {
        setSummary(s);
        if (!date) setDate(s.date);
        return api.getReadings({ date: s.date, sort_by: "measured_at", order: "asc" });
      })
      .then((r) => setReadings(r ?? []))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Не удалось загрузить аналитику"))
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const chartData = readings
    .filter((r) => r.location === "atrium")
    .map((r) => ({
      time: new Date(r.measured_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
      atrium: r.temperature,
      outside: readings.find(
        (o) => o.location === "outside" && Math.abs(new Date(o.measured_at).getTime() - new Date(r.measured_at).getTime()) < 30 * 60 * 1000
      )?.temperature ?? null,
    }));

  return (
    <div className="page">
      <h1>Аналитика</h1>

      <label className="date-picker">
        Дата
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      {loading && <Loading />}
      {!loading && error && <ErrorView message={error} onRetry={load} />}
      {!loading && !error && summary && summary.min_temperature === null && (
        <EmptyView message="Нет измерений за выбранный день" />
      )}

      {!loading && !error && summary && summary.min_temperature !== null && (
        <>
          <div className="card-grid">
            <div className="metric-card">
              <span className="metric-label">Мин. температура</span>
              <span className="metric-value">{summary.min_temperature}°C</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Макс. температура</span>
              <span className="metric-value">{summary.max_temperature}°C</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Средняя температура</span>
              <span className="metric-value">{summary.avg_temperature}°C</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Comfort score дня</span>
              <span className="metric-value">{summary.comfort_score}/100</span>
            </div>
          </div>

          <ul className="insights-list">
            <li>
              Самое прохладное время:{" "}
              {summary.coolest_time ? new Date(summary.coolest_time).toLocaleTimeString("ru-RU") : "—"}
            </li>
            <li>
              Самое тихое время:{" "}
              {summary.quietest_time ? new Date(summary.quietest_time).toLocaleTimeString("ru-RU") : "—"}
            </li>
            <li>Лучший период для учёбы: {summary.best_study_period ?? "—"}</li>
            <li>Самый жаркий период: {summary.hottest_period ?? "—"}</li>
            <li>Некомфортных измерений: {summary.uncomfortable_readings_count}</li>
            <li>
              Средняя разница температур (атриум − улица):{" "}
              {summary.avg_inside_outside_diff !== null ? `${summary.avg_inside_outside_diff}°C` : "—"}
            </li>
          </ul>

          {chartData.length > 0 && (
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis unit="°C" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="atrium" name="Атриум" stroke="#2563eb" dot={false} />
                  <Line type="monotone" dataKey="outside" name="Улица" stroke="#f97316" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
