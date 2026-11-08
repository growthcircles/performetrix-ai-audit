import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/data/auth';
import { createClient } from '@/lib/supabase/server';
import { get360ReportData, hasChroReportAccess } from '@/lib/data/three-sixty';
import { logAccess } from '@/lib/data/audit';
import ThreeSixtyReportView from '@/components/report/ThreeSixtyReportView';
import { Logo } from '@/components/Logo';

export default async function ThreeSixtyReportPage(props: PageProps<'/reports/[leaderId]/360'>) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { leaderId } = await props.params;
  const backHref = user.role === 'chro' ? `/chro/${leaderId}/raters` : '/admin';

  const supabase = await createClient();
  const { data: leader } = await supabase
    .from('leaders')
    .select('id, customer_id')
    .eq('id', leaderId)
    .maybeSingle();

  if (!leader || (user.role === 'chro' && leader.customer_id !== user.customer_id)) {
    return (
      <div className="theme-ink">
        <main className="shell">
          <a className="back-link" href={backHref}>&larr; Back to console</a>
          <div style={{ marginBottom: 18 }}><Logo height={32} /></div>
          <div className="h1" style={{ fontSize: 26 }}>Report not found</div>
          <p className="sub">This report doesn&apos;t exist or isn&apos;t visible to your account.</p>
        </main>
      </div>
    );
  }

  // The coach (super_admin) always has access; a CHRO must have explicitly
  // granted themselves access from their own console first - this is the
  // brief's "more sensitive than the diagnostic, not automatic" bar.
  if (user.role === 'chro') {
    const granted = await hasChroReportAccess(leaderId);
    if (!granted) {
      return (
        <div className="theme-ink">
          <main className="shell">
            <a className="back-link" href={backHref}>&larr; Back to console</a>
            <div style={{ marginBottom: 18 }}><Logo height={32} /></div>
            <div className="h1" style={{ fontSize: 26 }}>Access not yet granted</div>
            <p className="sub">
              Grant yourself access to this leader&apos;s 360 report from their raters page first.
            </p>
          </main>
        </div>
      );
    }
  }

  const report = await get360ReportData(leaderId);
  if (!report) {
    return (
      <div className="theme-ink">
        <main className="shell">
          <a className="back-link" href={backHref}>&larr; Back to console</a>
          <div style={{ marginBottom: 18 }}><Logo height={32} /></div>
          <div className="h1" style={{ fontSize: 26 }}>Report not ready</div>
          <p className="sub">This leader&apos;s 360 data isn&apos;t available yet.</p>
        </main>
      </div>
    );
  }

  await logAccess({ actorId: user.id, action: 'view_360_report', targetType: 'leader', targetId: leaderId, detail: report.leaderName });

  return <ThreeSixtyReportView orgName={report.orgName} threeSixty={report} backHref={backHref} />;
}
