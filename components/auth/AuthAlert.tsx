type AuthAlertProps = {
  error?: string;
  message?: string;
};

export function AuthAlert({ error, message }: AuthAlertProps) {
  if (!error && !message) return null;

  if (error) {
    return (
      <div
        role="alert"
        className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800"
      >
        {error}
      </div>
    );
  }

  return (
    <div
      role="status"
      className="mb-4 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900"
    >
      {message}
    </div>
  );
}
