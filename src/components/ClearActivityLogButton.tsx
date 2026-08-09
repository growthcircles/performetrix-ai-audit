'use client';

export function ClearActivityLogButton({ action }: { action: () => void }) {
  return (
    <form
      action={() => action()}
      onSubmit={(e) => {
        if (!confirm('Clear all activity log entries? This cannot be undone.')) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 10.5 }}>
        Clear log
      </button>
    </form>
  );
}
