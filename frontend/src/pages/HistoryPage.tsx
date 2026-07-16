import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { brightnessLabel, noiseLabel } from "../api/labels";
import type { Location, Reading } from "../api/types";
import { EmptyView, ErrorView, Loading } from "../components/StateViews";

const NOISE_OPTIONS = ["Very quiet", "Quiet", "Mild noise", "Noisy", "Very noisy"];

export default function HistoryPage() {
  const [readings, setReadings] = useState<Reading[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState("");
  const [location, setLocation] = useState<Location | "">("");
  const [noise, setNoise] = useState("");
  const [minTemp, setMinTemp] = useState("");
  const [maxTemp, setMaxTemp] = useState("");
  const [sortBy, setSortBy] = useState<"measured_at" | "temperature">("measured_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .getReadings({
        date: date || undefined,
        location: (location as Location) || undefined,
        noise: noise || undefined,
        min_temperature: minTemp ? Number(minTemp) : undefined,
        max_temperature: maxTemp ? Number(maxTemp) : undefined,
        sort_by: sortBy,
        order,
      })
      .then(setReadings)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Не удалось загрузить историю"))
      .finally(() => setLoading(false));
  }, [date, location, noise, minTemp, maxTemp, sortBy, order]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="page">
      <h1>История измерений</h1>

      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <label>
          Дата
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          Место
          <select value={location} onChange={(e) => setLocation(e.target.value as Location | "")}>
            <option value="">Все</option>
            <option value="atrium">Атриум</option>
            <option value="outside">Улица</option>
          </select>
        </label>
        <label>
          Шум
          <select value={noise} onChange={(e) => setNoise(e.target.value)}>
            <option value="">Любой</option>
            {NOISE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {noiseLabel(n)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Темп. от
          <input
            type="number"
            step="0.1"
            value={minTemp}
            onChange={(e) => setMinTemp(e.target.value)}
            placeholder="°C"
          />
        </label>
        <label>
          Темп. до
          <input
            type="number"
            step="0.1"
            value={maxTemp}
            onChange={(e) => setMaxTemp(e.target.value)}
            placeholder="°C"
          />
        </label>
        <label>
          Сортировать по
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
            <option value="measured_at">Времени</option>
            <option value="temperature">Температуре</option>
          </select>
        </label>
        <label>
          Порядок
          <select value={order} onChange={(e) => setOrder(e.target.value as typeof order)}>
            <option value="desc">По убыванию</option>
            <option value="asc">По возрастанию</option>
          </select>
        </label>
        <button className="btn btn-primary" type="submit">
          Применить
        </button>
      </form>

      {loading && <Loading />}
      {!loading && error && <ErrorView message={error} onRetry={load} />}
      {!loading && !error && readings && readings.length === 0 && (
        <EmptyView message="Нет измерений по заданным фильтрам" />
      )}
      {!loading && !error && readings && readings.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Время</th>
                <th>Место</th>
                <th>Температура</th>
                <th>Категория</th>
                <th>Освещение</th>
                <th>Шум</th>
              </tr>
            </thead>
            <tbody>
              {readings.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.measured_at).toLocaleString("ru-RU")}</td>
                  <td>{r.location === "atrium" ? "Атриум" : "Улица"}</td>
                  <td>{r.temperature}°C</td>
                  <td>{r.temperature_label}</td>
                  <td>{brightnessLabel(r.brightness)}</td>
                  <td>{noiseLabel(r.noise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
