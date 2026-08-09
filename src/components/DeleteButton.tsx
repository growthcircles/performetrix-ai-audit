'use client';

export function DeleteButton({
  id,
  label,
  confirmMessage,
  action,
}: {
  id: string;
  label: string;
  confirmMessage: string;
  action: (id: string) => void;
}) {
  return (
    <form
      action={() => action(id)}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <button type="submit" className="btn btn-ghost">{label}</button>
    </form>
  );
}
