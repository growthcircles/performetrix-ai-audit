import { redirect } from 'next/navigation';
import { getCustomerDetail } from '@/lib/data/admin';
import { updateCustomerName, updateChroEmail, deleteChro, deleteCustomer } from '../../actions';
import { EditChroEmailForm } from '@/components/EditChroEmailForm';
import { DeleteButton } from '@/components/DeleteButton';
import { Logo } from '@/components/Logo';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default async function CustomerDetailPage(props: PageProps<'/admin/customers/[customerId]'>) {
  const { customerId } = await props.params;
  const customer = await getCustomerDetail(customerId);
  if (!customer) redirect('/admin');

  const completedCount = customer.leaders.filter((l) => l.status === 'completed').length;
  const updateCustomerNameWithId = updateCustomerName.bind(null, customerId);

  return (
    <div className="theme-ink">
      <main className="shell">
        <a className="back-link" href="/admin">&larr; Back to dashboard</a>
        <div className="brand-row">
          <Logo />
          <span className="eyebrow">Admin</span>
        </div>
        <div className="h1">{customer.name}</div>
        <p className="sub">
          {completedCount} of {customer.leaders.length} leaders completed
        </p>

        <div className="panel">
          <div className="panel-title">Organisation name</div>
          <form action={updateCustomerNameWithId} className="add-row">
            <input name="name" defaultValue={customer.name} required />
            <button type="submit" className="btn">Save</button>
          </form>
        </div>

        <div className="panel">
          <div className="panel-title">CHRO accounts ({customer.chros.length})</div>
          {customer.chros.length === 0 && <div className="empty-note">No CHRO invited yet.</div>}
          {customer.chros.map((c) => (
            <div className="leader-row" key={c.id} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="leader-name">{c.name}</div>
                  <div className="leader-meta">{c.email}</div>
                </div>
                <DeleteButton
                  id={c.id}
                  label="Delete"
                  confirmMessage={`Remove ${c.name}'s CHRO account (${c.email})? This permanently deletes their login and cannot be undone.`}
                  action={deleteChro}
                />
              </div>
              <EditChroEmailForm userId={c.id} currentEmail={c.email} action={updateChroEmail} />
            </div>
          ))}
        </div>

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
                    <a className="btn btn-ghost" href={`/reports/${l.id}/360`}>View 360 report</a>
                  </>
                ) : (
                  <span className="status-pill status-pending">Pending</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-title">Danger zone</div>
          <p className="sub" style={{ marginBottom: 16 }}>
            Deletes this organisation, its CHRO account(s), and all its leaders and submissions. This
            cannot be undone.
          </p>
          <DeleteButton
            id={customerId}
            label="Delete this organisation"
            confirmMessage={`Delete ${customer.name} entirely, including its CHRO account(s) and all ${customer.leaders.length} leader(s)? This permanently removes all their data and cannot be undone.`}
            action={deleteCustomer}
          />
        </div>
      </main>
    </div>
  );
}
