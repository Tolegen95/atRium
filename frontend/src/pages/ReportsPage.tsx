import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import type { Report, ReportCategory, ReportStatus } from "../api/types";
import { EmptyView, ErrorView, Loading } from "../components/StateViews";
import { useToast } from "../context/ToastContext";

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  too_hot: "Слишком жарко",
  too_noisy: "Слишком шумно",
  too_bright: "Слишком ярко",
  too_dark: "Слишком темно",
  comfortable: "Комфортно",
  other: "Другое",
};

export default function ReportsPage() {
  const { notify } = useToast();
  const [reports, setReports] = useState<Report[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "">("");

  const [category, setCategory] = useState<ReportCategory>("comfortable");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editComment, setEditComment] = useState("");
  const [editCategory, setEditCategory] = useState<ReportCategory>("comfortable");

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .listReports(statusFilter || undefined)
      .then(setReports)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Не удалось загрузить отчёты"))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createReport({ category, comment: comment || null });
      setComment("");
      setCategory("comfortable");
      notify("Отчёт успешно создан");
      load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Не удалось создать отчёт", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(report: Report) {
    setEditingId(report.id);
    setEditCategory(report.category);
    setEditComment(report.comment ?? "");
  }

  async function saveEdit(id: number) {
    try {
      await api.updateReport(id, { category: editCategory, comment: editComment || null });
      notify("Отчёт обновлён");
      setEditingId(null);
      load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Не удалось обновить отчёт", "error");
    }
  }

  async function toggleResolved(report: Report) {
    try {
      await api.updateReport(report.id, {
        status: report.status === "open" ? "resolved" : "open",
      });
      notify(report.status === "open" ? "Отчёт отмечен решённым" : "Отчёт снова открыт");
      load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Не удалось изменить статус", "error");
    }
  }

  async function confirmDelete(id: number) {
    try {
      await api.deleteReport(id);
      notify("Отчёт удалён");
      setConfirmDeleteId(null);
      load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Не удалось удалить отчёт", "error");
    }
  }

  return (
    <div className="page">
      <h1>Отчёты пользователей</h1>

      <form className="report-form" onSubmit={handleCreate}>
        <label>
          Категория
          <select value={category} onChange={(e) => setCategory(e.target.value as ReportCategory)}>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grow">
          Комментарий
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Необязательно"
            maxLength={1000}
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Отправка..." : "Оставить отзыв"}
        </button>
      </form>

      <div className="filters">
        <label>
          Статус
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ReportStatus | "")}>
            <option value="">Все</option>
            <option value="open">Открытые</option>
            <option value="resolved">Решённые</option>
          </select>
        </label>
      </div>

      {loading && <Loading />}
      {!loading && error && <ErrorView message={error} onRetry={load} />}
      {!loading && !error && reports && reports.length === 0 && (
        <EmptyView message="Отчётов пока нет" />
      )}

      {!loading && !error && reports && reports.length > 0 && (
        <ul className="report-list">
          {reports.map((r) => (
            <li key={r.id} className={`report-item status-${r.status}`}>
              {editingId === r.id ? (
                <div className="report-edit">
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as ReportCategory)}
                  >
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                  />
                  <button className="btn btn-primary" onClick={() => saveEdit(r.id)}>
                    Сохранить
                  </button>
                  <button className="btn btn-secondary" onClick={() => setEditingId(null)}>
                    Отмена
                  </button>
                </div>
              ) : (
                <>
                  <div className="report-main">
                    <span className="report-category">{CATEGORY_LABELS[r.category]}</span>
                    {r.comment && <span className="report-comment">{r.comment}</span>}
                    <span className="report-date">
                      {new Date(r.created_at).toLocaleString("ru-RU")}
                    </span>
                    <span className="report-status-badge">
                      {r.status === "open" ? "Открыт" : "Решён"}
                    </span>
                  </div>
                  <div className="report-actions">
                    <button className="btn btn-secondary" onClick={() => toggleResolved(r)}>
                      {r.status === "open" ? "Отметить решённым" : "Открыть снова"}
                    </button>
                    <button className="btn btn-secondary" onClick={() => startEdit(r)}>
                      Редактировать
                    </button>
                    {confirmDeleteId === r.id ? (
                      <>
                        <span className="confirm-text">Удалить?</span>
                        <button className="btn btn-danger" onClick={() => confirmDelete(r.id)}>
                          Да
                        </button>
                        <button className="btn btn-secondary" onClick={() => setConfirmDeleteId(null)}>
                          Нет
                        </button>
                      </>
                    ) : (
                      <button className="btn btn-danger" onClick={() => setConfirmDeleteId(r.id)}>
                        Удалить
                      </button>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
