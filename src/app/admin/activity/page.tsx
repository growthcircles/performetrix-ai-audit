import { redirect } from 'next/navigation';
import { getAuditLog } from '@/lib/data/admin';
import { clearActivityLog } from '../actions';
import { ClearActivityLogButton } from '@/components/ClearActivityLogButton';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const ACTION_LABELS: Record<string, string> = {
  view_report: 'viewed the report for leader',
  delete_leader: 'deleted leader',
  create_customer: 'created customer',
  invite_chro: 'invited CHRO',
  clear_activity_log: 'cleared the activity log',
  update_customer: 'renamed customer',
  update_chro_email: 'updated CHRO email',
};

export default async function ActivityLogPage() {
  const auditLog = await getAuditLog();
  if (!auditLog) redirect('/');

  return (
    <div className="theme-ink">
      <main className="shell">
        <a className="back-link" href="/admin">&larr; Back to dashboard</a>
        <div className="eyebrow">FutureReady &middot; Admin</div>
        <div className="h1">Activity Log</div>
        <p className="sub">Who viewed which report, who deleted what, who was invited, and when.</p>

        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="panel-title" style={{ marginBottom: 0 }}>All activity ({auditLog.length})</div>
            {auditLog.length > 0 && <ClearActivityLogButton action={clearActivityLog} />}
          </div>
          {auditLog.length === 0 && <div className="empty-note">No activity logged yet.</div>}
          {auditLog.map((entry) => (
            <div className="leader-row" key={entry.id}>
              <div>
                <div className="leader-name" style={{ fontSize: 14 }}>
                  {entry.actorName} {ACTION_LABELS[entry.action] ?? `${entry.action} ${entry.targetType}`}
                  {(entry.detail ?? entry.targetId) ? ` ${entry.detail ?? entry.targetId?.slice(0, 8)}` : ''}
                </div>
                <div className="leader-meta">{entry.actorEmail} &middot; {formatDateTime(entry.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
