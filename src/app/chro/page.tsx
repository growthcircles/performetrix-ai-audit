import { redirect } from 'next/navigation';
import { getChroConsoleData } from '@/lib/data/leaders';
import { signOut } from '@/app/actions';
import { addLeader } from './actions';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default async function ChroConsolePage() {
  const data = await getChroConsoleData();
  if (!data) redirect('/');

  const { customer, leaders } = data;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  return (
    <div className="theme-ink">
      <main className="shell">
        <div className="eyebrow">FutureReady &middot; CHRO Console</div>
        <div className="h1">Readiness Diagnostics</div>
        <p className="sub">
          Generate a confidential link for each leader. Only you and Shiva Venkateswaran see individual
          results. Leaders never see each other&apos;s scores.
        </p>

        <div className="org-row">
          <label>Organisation</label>
          <span className="org-name">{customer?.name}</span>
        </div>

        <div className="panel">
          <div className="panel-title">Add a leader</div>
          <form action={addLeader} className="add-row">
            <input name="name" placeholder="Leader full name" required />
            <button type="submit" className="btn">Generate confidential link</button>
          </form>
        </div>

        <div className="panel">
          <div className="panel-title">Leaders ({leaders.length})</div>
          {leaders.length === 0 && <div className="empty-note">No leaders added yet.</div>}
          {leaders.map((leader) => (
            <div className="leader-row" key={leader.id}>
              <div>
                <div className="leader-name">{leader.name}</div>
                <div className="leader-meta">
                  added {formatDate(leader.created_at)}
                  {leader.status === 'pending' && (
                    <div className="link-box">{appUrl}/a/{leader.token}</div>
                  )}
                </div>
              </div>
              <div className="row-actions">
                {leader.status === 'completed' ? (
                  <span className="status-pill status-done">Completed</span>
                ) : (
                  <span className="status-pill status-pending">Pending</span>
                )}
              </div>
            </div>
          ))}
          <div className="confidentiality-note">
            Each link is unique to one leader and carries no visible identifying detail. Completed
            results are delivered to you as CHRO, with a copy to Shiva Venkateswaran for follow-up
            preparation. Nothing is shared between leaders.
          </div>
        </div>

        <form action={signOut}>
          <button type="submit" className="btn btn-ghost">Sign out</button>
        </form>
      </main>
    </div>
  );
}
