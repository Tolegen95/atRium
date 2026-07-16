export type Location = "atrium" | "outside";

export type ReportCategory =
  | "too_hot"
  | "too_noisy"
  | "too_bright"
  | "too_dark"
  | "comfortable"
  | "other";

export type ReportStatus = "open" | "resolved";

export interface Reading {
  id: number;
  measured_at: string;
  location: Location;
  temperature: number;
  temperature_label: string;
  brightness: string | null;
  noise: string | null;
}

export interface CurrentStatus {
  atrium_temperature: number | null;
  outside_temperature: number | null;
  atrium_temperature_label: string | null;
  outside_temperature_label: string | null;
  brightness: string | null;
  noise: string | null;
  last_measured_at: string | null;
  status_label: string;
  comfort_score: number | null;
}

export interface Summary {
  date: string;
  min_temperature: number | null;
  max_temperature: number | null;
  avg_temperature: number | null;
  coolest_time: string | null;
  quietest_time: string | null;
  best_study_period: string | null;
  hottest_period: string | null;
  uncomfortable_readings_count: number;
  avg_inside_outside_diff: number | null;
  comfort_score: number | null;
}

export interface Report {
  id: number;
  created_at: string;
  category: ReportCategory;
  comment: string | null;
  status: ReportStatus;
}

export interface ReportInput {
  category: ReportCategory;
  comment?: string | null;
  status?: ReportStatus;
}

export interface RefreshResult {
  checked: number;
  added: number;
  latest_measured_at: string | null;
}

export interface ReadingsQuery {
  date?: string;
  location?: Location;
  noise?: string;
  brightness?: string;
  min_temperature?: number;
  max_temperature?: number;
  sort_by?: "measured_at" | "temperature";
  order?: "asc" | "desc";
}
