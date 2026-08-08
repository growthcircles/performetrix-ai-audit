'use client';

export function DeleteLeaderButton({
  leaderId,
  leaderName,
  action,
}: {
  leaderId: string;
  leaderName: string;
  action: (leaderId: string) => void;
}) {
  return (
    <form
      action={() => action(leaderId)}
      onSubmit={(e) => {
        if (!confirm(`Delete ${leaderName}? This permanently removes their data and cannot be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="btn btn-ghost">Delete</button>
    </form>
  );
}
