'use client';

export function DeleteRaterButton({
  raterId,
  raterName,
  action,
}: {
  raterId: string;
  raterName: string;
  action: (raterId: string) => void;
}) {
  return (
    <form
      action={() => action(raterId)}
      onSubmit={(e) => {
        if (!confirm(`Remove ${raterName} as a rater? Their link will stop working.`)) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="btn btn-ghost">Remove</button>
    </form>
  );
}
