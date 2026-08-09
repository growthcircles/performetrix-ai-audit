import { redirect } from 'next/navigation';
import { getAdminOverview } from '@/lib/data/admin';
import { signOut } from '@/app/actions';
import { createCustomer, inviteChro } from './actions';
import { InviteChroForm } from '@/components/InviteChroForm';
import { Logo } from '@/components/Logo';

export default async function AdminPage() {
  const data = await getAdminOverview();
  if (!data) redirect('/');

  const completionRate = data.totalLeaders
    ? Math.round((data.completedLeaders / data.totalLeaders) * 100)
    : 0;

  return (
    <div className="theme-ink">
      <main className="shell">
        <div className="brand-row">
          <Logo />
          <span className="eyebrow">Admin</span>
        </div>
        <div className="h1">Cross-Customer Overview</div>
        <p className="sub">Every customer, every leader, every completed report, in one place.</p>

        <div className="panel">
          <div className="panel-title">Summary</div>
          <div className="stat-row">
            <div className="stat">
              <div className="stat-value">{data.totalCustomers}</div>
              <div className="stat-label">Customers</div>
            </div>
            <div className="stat">
              <div className="stat-value">{data.totalLeaders}</div>
              <div className="stat-label">Leaders</div>
            </div>
            <div className="stat">
              <div className="stat-value">{data.completedLeaders}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat">
              <div className="stat-value">{completionRate}%</div>
              <div className="stat-label">Completion rate</div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">Create a customer</div>
          <form action={createCustomer} className="add-row">
            <input name="name" placeholder="Organisation name" required />
            <button type="submit" className="btn">Create</button>
          </form>
        </div>

        <div className="panel">
          <div className="panel-title">Invite a CHRO</div>
          {data.customers.length === 0 ? (
            <div className="empty-note">Create a customer first before inviting a CHRO for them.</div>
          ) : (
            <InviteChroForm customers={data.customers} action={inviteChro} />
          )}
        </div>

        <div className="panel">
          <div className="panel-title">Score patterns across customers</div>
          {data.pillarPatterns.map((p) => (
            <div className="subdim-block" key={p.key}>
              <div className="subdim-top">
                <span className="subdim-name">{p.name}</span>
                <span className="subdim-score">
                  {p.totalCount ? `${p.avgScore} avg · ${p.flaggedCount}/${p.totalCount} flagged` : 'No submissions yet'}
                </span>
              </div>
              {p.totalCount > 0 && (
                <div className="subdim-bar">
                  <div className="subdim-fill" style={{ width: `${p.avgScore}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-title">Customers ({data.customers.length})</div>
          {data.customers.length === 0 && <div className="empty-note">No customers yet.</div>}
          {data.customers.map((c) => (
            <a className="leader-row" href={`/admin/customers/${c.id}`} key={c.id} style={{ cursor: 'pointer' }}>
              <div>
                <div className="leader-name">{c.name}</div>
                <div className="leader-meta">
                  {c.completedCount} of {c.leaderCount} leaders completed
                </div>
              </div>
            </a>
          ))}
        </div>

        <a className="back-link" href="/admin/activity" style={{ marginBottom: 0 }}>
          View activity log &rarr;
        </a>

        <form action={signOut} style={{ marginTop: 24 }}>
          <button type="submit" className="btn btn-ghost">Sign out</button>
        </form>
      </main>
    </div>
  );
}
