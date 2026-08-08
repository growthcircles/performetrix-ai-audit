import { getLeaderByToken } from '@/lib/data/assessment';
import { getPublicAssessment } from '@/lib/assessment/public-view';
import AssessmentFlow from './AssessmentFlow';

export default async function AssessmentPage(props: PageProps<'/a/[token]'>) {
  const { token } = await props.params;
  const leader = await getLeaderByToken(token);

  if (!leader) {
    return (
      <div className="theme-paper">
        <main className="shell confirm-box">
          <div className="h1" style={{ fontSize: 26 }}>This link isn&apos;t valid</div>
          <p className="sub" style={{ margin: '0 auto' }}>
            Check the link your CHRO sent you, or ask them to send a new one.
          </p>
        </main>
      </div>
    );
  }

  if (leader.status === 'completed') {
    return (
      <div className="theme-paper">
        <main className="shell confirm-box">
          <div className="confirm-mark">&#10003;</div>
          <div className="h1" style={{ fontSize: 26 }}>Already submitted</div>
          <p className="sub" style={{ margin: '0 auto' }}>
            This assessment has already been completed. Nothing further is needed from you.
          </p>
        </main>
      </div>
    );
  }

  return <AssessmentFlow token={token} orgName={leader.orgName} pillars={getPublicAssessment()} />;
}
