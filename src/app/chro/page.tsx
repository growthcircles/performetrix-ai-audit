import { redirect } from 'next/navigation';
import { getChroConsoleData } from '@/lib/data/leaders';
import { signOut } from '@/app/actions';
import { addLeader, deleteLeader } from './actions';
import { DeleteLeaderButton } from '@/components/DeleteLeaderButton';
import { Logo } from '@/components/Logo';

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
        <div className="brand-row">
          <Logo />
          <span className="eyebrow">CHRO Console</span>
        </div>
        <div className="h1">FutureReady Leadership Diagnostic Assessment</div>
        <p className="sub">
          Generate a confidential link for each leader. Only you and Shiva Venkateswaran of Growth
          Circles see individual results. Leaders never see each other&apos;s scores.
        </p>

        <div className="panel how-it-works">
          <div className="panel-title">How this works</div>
          <div className="how-step">
            <strong>1. Add a leader in the box below.</strong> Type their full name, then click Generate
            Confidential Link.
          </div>
          <div className="how-step">
            <strong>2. You&apos;ll see the unique link appear right there.</strong> Copy it and share it
            yourself, by email, Slack, however you&apos;d normally reach them. Each link is private to
            that one person.
          </div>
          <div className="how-step">
            <strong>3. Reports land here as they&apos;re completed.</strong> You&apos;ll get an email the
            moment a result is ready, no need to keep checking back.
          </div>
        </div>

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
          {leaders.length === 0 && (
            <div className="empty-note">No leaders added yet. Add your first one above to get started.</div>
          )}
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
                  <>
                    <span className="status-pill status-done">Completed</span>
                    <a className="btn btn-ghost" href={`/reports/${leader.id}`}>View report</a>
                  </>
                ) : (
                  <span className="status-pill status-pending">Pending</span>
                )}
                <DeleteLeaderButton leaderId={leader.id} leaderName={leader.name} action={deleteLeader} />
              </div>
            </div>
          ))}
          <div className="confidentiality-note">
            Each link is unique to one leader and carries no visible identifying detail. Completed
            results are delivered to you as CHRO, with a copy to Shiva Venkateswaran of Growth Circles
            for follow-up preparation. Nothing is shared between leaders.
          </div>
        </div>

        <a className="back-link" href="/sample-report" style={{ marginBottom: 0 }}>
          Preview a sample report, no assessment needed &rarr;
        </a>

        <div className="support-note">
          Questions? Email <a href="mailto:shiva@growth-circles.com">shiva@growth-circles.com</a>, happy
          to help.
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <a
            className="btn"
            href="https://cal.com/growthcircles/30min"
            target="_blank"
            rel="noopener noreferrer"
          >
            Book a meeting with Shiva
          </a>
        </div>

        <form action={signOut} style={{ marginTop: 24 }}>
          <button type="submit" className="btn btn-ghost">Sign out</button>
        </form>
      </main>
    </div>
  );
}
