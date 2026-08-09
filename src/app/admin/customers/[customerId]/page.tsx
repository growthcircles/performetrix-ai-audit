import { redirect } from 'next/navigation';
import { getCustomerDetail } from '@/lib/data/admin';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default async function CustomerDetailPage(props: PageProps<'/admin/customers/[customerId]'>) {
  const { customerId } = await props.params;
  const customer = await getCustomerDetail(customerId);
  if (!customer) redirect('/admin');

  const completedCount = customer.leaders.filter((l) => l.status === 'completed').length;

  return (
    <div className="theme-ink">
      <main className="shell">
        <a className="back-link" href="/admin">&larr; Back to dashboard</a>
        <div className="eyebrow">FutureReady &middot; Admin</div>
        <div className="h1">{customer.name}</div>
        <p className="sub">
          {completedCount} of {customer.leaders.length} leaders completed
        </p>

        <div className="panel">
          <div className="panel-title">Leaders ({customer.leaders.length})</div>
          {customer.leaders.length === 0 && <div className="empty-note">No leaders yet.</div>}
          {customer.leaders.map((l) => (
            <div className="leader-row" key={l.id}>
              <div>
                <div className="leader-name">{l.name}</div>
                <div className="leader-meta">added {formatDate(l.createdAt)}</div>
              </div>
              <div className="row-actions">
                {l.status === 'completed' ? (
                  <>
                    <span className="status-pill status-done">Completed</span>
                    <a className="btn btn-ghost" href={`/reports/${l.id}`}>View report</a>
                  </>
                ) : (
                  <span className="status-pill status-pending">Pending</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
