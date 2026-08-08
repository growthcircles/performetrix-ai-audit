import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/data/auth';
import { getLeaderReport } from '@/lib/data/reports';
import ReportView from '@/components/report/ReportView';

export default async function ReportPage(props: PageProps<'/reports/[leaderId]'>) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { leaderId } = await props.params;
  const report = await getLeaderReport(leaderId);

  if (!report) {
    return (
      <div className="theme-ink">
        <main className="shell">
          <a className="back-link" href={user.role === 'chro' ? '/chro' : '/admin'}>&larr; Back to console</a>
          <div className="h1" style={{ fontSize: 26 }}>Report not found</div>
          <p className="sub">
            This report doesn&apos;t exist, isn&apos;t ready yet, or isn&apos;t visible to your account.
          </p>
        </main>
      </div>
    );
  }

  return (
    <ReportView
      leaderName={report.leaderName}
      orgName={report.orgName}
      chroName={report.chroName}
      scores={report.scores}
      backHref={user.role === 'chro' ? '/chro' : '/admin'}
    />
  );
}
