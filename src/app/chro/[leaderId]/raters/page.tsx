import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/data/auth';
import { createClient } from '@/lib/supabase/server';
import {
  getRatersForLeader,
  get360Status,
  hasChroReportAccess,
  getReportSendStatus,
} from '@/lib/data/three-sixty';
import {
  nominateRaterAction,
  deleteRaterAction,
  toggleReportAccessAction,
  sendReportToLeaderAction,
} from './actions';
import { DeleteRaterButton } from '@/components/DeleteRaterButton';
import { Logo } from '@/components/Logo';
import type { RaterGroup } from '@/lib/three-sixty/types';

const GROUP_LABELS: Record<RaterGroup, string> = {
  self: 'Self',
  manager: 'Manager',
  peer: 'Peers',
  direct_report: 'Direct reports',
  other_stakeholder: 'Other stakeholders',
};

const MINIMUMS: Partial<Record<RaterGroup, number>> = { peer: 3, direct_report: 3, other_stakeholder: 3 };

const STATUS_LABEL: Record<string, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  ready: 'Ready to report',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default async function RatersPage(props: PageProps<'/chro/[leaderId]/raters'>) {
  const { leaderId } = await props.params;
  const user = await getCurrentUser();
  if (!user || user.role !== 'chro' || !user.customer_id) redirect('/');

  const supabase = await createClient();
  const { data: leader } = await supabase
    .from('leaders')
    .select('id, name, customer_id, status')
    .eq('id', leaderId)
    .maybeSingle();

  if (!leader || leader.customer_id !== user.customer_id) redirect('/chro');

  const [raters, status, hasAccess, sendStatus] = await Promise.all([
    getRatersForLeader(leaderId),
    get360Status(leaderId),
    hasChroReportAccess(leaderId),
    getReportSendStatus(leaderId),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const nominateWithId = nominateRaterAction.bind(null, leaderId);
  const deleteWithId = deleteRaterAction.bind(null, leaderId);
  const grantAccess = toggleReportAccessAction.bind(null, leaderId, true);
  const revokeAccess = toggleReportAccessAction.bind(null, leaderId, false);
  const sendReportWithId = sendReportToLeaderAction.bind(null, leaderId);

  const selfRater = raters.find((r) => r.raterGroup === 'self');
  const externalGroups: RaterGroup[] = ['manager', 'peer', 'direct_report', 'other_stakeholder'];

  return (
    <div className="theme-ink">
      <main className="shell">
        <a className="back-link" href="/chro">&larr; Back to console</a>
        <div className="brand-row">
          <Logo />
          <span className="eyebrow">360 Assessment</span>
        </div>
        <div className="h1">{leader.name}</div>
        <p className="sub">
          Manager, peers, and direct reports each rate {leader.name} alongside their own self-rated
          version of this instrument. Individual peer and direct-report responses are never shown,
          only group averages once at least 3 have responded.
        </p>

        <div className="org-row">
          <label>360 status</label>
          <span className={`status-pill ${status === 'ready' ? 'status-done' : 'status-pending'}`}>
            {STATUS_LABEL[status] ?? status}
          </span>
        </div>

        <div className="panel">
          <div className="panel-title">Add a rater</div>
          <form action={nominateWithId} className="add-row">
            <input name="name" placeholder="Full name" required />
            <input name="email" type="email" placeholder="Email" required />
            <select name="group" required defaultValue="">
              <option value="" disabled>Group</option>
              <option value="manager">Manager</option>
              <option value="peer">Peer</option>
              <option value="direct_report">Direct report</option>
              <option value="other_stakeholder">Other stakeholder</option>
            </select>
            <button type="submit" className="btn">Add &amp; generate link</button>
          </form>
        </div>

        {selfRater && (
          <div className="panel">
            <div className="panel-title">{leader.name}&apos;s own 360 self-assessment</div>
            <div className="leader-row">
              <div>
                <div className="leader-name">Self-rated (first-person version)</div>
                {selfRater.status === 'pending' && (
                  <div className="link-box">{appUrl}/r/{selfRater.token}</div>
                )}
              </div>
              <span className={`status-pill ${selfRater.status === 'completed' ? 'status-done' : 'status-pending'}`}>
                {selfRater.status === 'completed' ? 'Completed' : 'Pending'}
              </span>
            </div>
          </div>
        )}

        {externalGroups.map((group) => {
          const groupRaters = raters.filter((r) => r.raterGroup === group);
          if (groupRaters.length === 0) return null;
          const completed = groupRaters.filter((r) => r.status === 'completed').length;
          const minimum = MINIMUMS[group];
          return (
            <div className="panel" key={group}>
              <div className="panel-title">
                {GROUP_LABELS[group]} ({completed} of {groupRaters.length} completed
                {minimum ? `, minimum ${minimum} to show a score` : ''})
              </div>
              {groupRaters.map((rater) => (
                <div className="leader-row" key={rater.id}>
                  <div>
                    <div className="leader-name">{rater.name}</div>
                    <div className="leader-meta">
                      {rater.email} &middot; added {formatDate(rater.createdAt)}
                      {rater.status === 'pending' && (
                        <div className="link-box">{appUrl}/r/{rater.token}</div>
                      )}
                    </div>
                  </div>
                  <div className="row-actions">
                    <span className={`status-pill ${rater.status === 'completed' ? 'status-done' : 'status-pending'}`}>
                      {rater.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                    <DeleteRaterButton raterId={rater.id} raterName={rater.name ?? 'this rater'} action={deleteWithId} />
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        <div className="panel">
          <div className="panel-title">Report access</div>
          <p className="sub" style={{ marginBottom: 12 }}>
            360 results are more sensitive than the diagnostic self-assessment, since they reflect how
            colleagues perceive a named leader. The coach always has access; you only get access once you
            grant it to yourself here.
          </p>
          {hasAccess ? (
            <form action={revokeAccess}>
              <span className="status-pill status-done" style={{ marginRight: 10 }}>Access granted</span>
              <button type="submit" className="btn btn-ghost">Revoke my access</button>
            </form>
          ) : (
            <form action={grantAccess}>
              <button type="submit" className="btn" disabled={status !== 'ready'}>
                Grant myself access
              </button>
              {status !== 'ready' && <p className="sub" style={{ marginTop: 8 }}>Available once the 360 is ready to report.</p>}
            </form>
          )}
          {hasAccess && (
            <a className="btn btn-ghost" style={{ marginTop: 12, display: 'inline-block' }} href={`/reports/${leaderId}/360`}>
              View 360 report
            </a>
          )}
        </div>

        <div className="panel">
          <div className="panel-title">Send report to {leader.name}</div>
          <p className="sub" style={{ marginBottom: 12 }}>
            Sends a private link {leader.name} can use to view their own 360 report. Nothing is sent
            automatically - this is your call, whenever you decide the moment is right.
          </p>
          <form action={sendReportWithId} className="add-row">
            <input name="email" type="email" placeholder={`${leader.name}'s email`} required disabled={!hasAccess} />
            <button type="submit" className="btn" disabled={!hasAccess}>
              {sendStatus.sentAt ? 'Send again' : 'Send report'}
            </button>
          </form>
          {sendStatus.sentAt && (
            <p className="sub" style={{ marginTop: 8 }}>Last sent {formatDate(sendStatus.sentAt)}.</p>
          )}
          {!hasAccess && <p className="sub" style={{ marginTop: 8 }}>Grant yourself access first.</p>}
        </div>
      </main>
    </div>
  );
}
