import { getLeaderReportByToken } from '@/lib/data/three-sixty';
import ThreeSixtyReportView from '@/components/report/ThreeSixtyReportView';
import { Logo } from '@/components/Logo';

// No auth - the token itself is the credential, same pattern as the
// leader's diagnostic /a/[token] link and a rater's /r/[token] link.
export default async function LeaderReportPage(props: PageProps<'/report/[token]'>) {
  const { token } = await props.params;
  const report = await getLeaderReportByToken(token);

  if (!report) {
    return (
      <div className="theme-ink">
        <main className="shell confirm-box">
          <div style={{ marginBottom: 18 }}><Logo height={36} /></div>
          <div className="h1" style={{ fontSize: 26 }}>This link isn&apos;t valid</div>
          <p className="sub" style={{ margin: '0 auto' }}>
            Check the link you were sent, or ask your CHRO for a new one.
          </p>
        </main>
      </div>
    );
  }

  return <ThreeSixtyReportView orgName={report.orgName} threeSixty={report} isLeaderView />;
}
