export function Loading({ label = "Загрузка..." }: { label?: string }) {
  return (
    <div className="state-view state-loading" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="state-view state-error" role="alert">
      <span>Ошибка: {message}</span>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  );
}

export function EmptyView({ message = "Нет данных" }: { message?: string }) {
  return (
    <div className="state-view state-empty">
      <span>{message}</span>
    </div>
  );
}
