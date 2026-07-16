import type {
  CurrentStatus,
  Reading,
  ReadingsQuery,
  RefreshResult,
  Report,
  ReportInput,
  Summary,
} from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.detail ? JSON.stringify(body.detail) : message;
    } catch {
      // ignore body parse errors
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

function buildQuery(params: object): string {
  const query = new URLSearchParams();
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  getReadings: (params: ReadingsQuery = {}) =>
    request<Reading[]>(`/api/readings${buildQuery(params)}`),

  getReading: (id: number) => request<Reading>(`/api/readings/${id}`),

  getCurrentStatus: () => request<CurrentStatus>(`/api/readings/current`),

  getSummary: (date?: string) =>
    request<Summary>(`/api/summary${buildQuery({ date })}`),

  listReports: (status?: string) =>
    request<Report[]>(`/api/reports${buildQuery({ status })}`),

  createReport: (payload: ReportInput) =>
    request<Report>(`/api/reports`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateReport: (id: number, payload: Partial<ReportInput>) =>
    request<Report>(`/api/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteReport: (id: number) =>
    request<void>(`/api/reports/${id}`, { method: "DELETE" }),

  refreshData: () => request<RefreshResult>(`/api/refresh`, { method: "POST" }),
};
