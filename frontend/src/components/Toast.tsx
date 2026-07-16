import { useEffect } from "react";

export interface ToastMessage {
  id: number;
  text: string;
  kind: "success" | "error";
}

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div className={`toast toast-${toast.kind}`}>
      {toast.text}
      <button
        className="toast-close"
        onClick={() => onDismiss(toast.id)}
        aria-label="Закрыть уведомление"
      >
        ×
      </button>
    </div>
  );
}
