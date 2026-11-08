import { getRaterByToken } from '@/lib/data/three-sixty';
import { getPublic360Assessment } from '@/lib/three-sixty/public-view';
import RaterAssessmentFlow from './RaterAssessmentFlow';
import { Logo } from '@/components/Logo';

export default async function RaterPage(props: PageProps<'/r/[token]'>) {
  const { token } = await props.params;
  const rater = await getRaterByToken(token);

  if (!rater) {
    return (
      <div className="theme-ink">
        <main className="shell confirm-box">
          <div style={{ marginBottom: 18 }}><Logo height={36} /></div>
          <div className="h1" style={{ fontSize: 26 }}>This link isn&apos;t valid</div>
          <p className="sub" style={{ margin: '0 auto' }}>
            Check the link you were sent, or ask for a new one.
          </p>
        </main>
      </div>
    );
  }

  if (rater.status === 'completed') {
    return (
      <div className="theme-ink">
        <main className="shell confirm-box">
          <div style={{ marginBottom: 18 }}><Logo height={36} /></div>
          <div className="confirm-mark">&#10003;</div>
          <div className="h1" style={{ fontSize: 26 }}>Already submitted</div>
          <p className="sub" style={{ margin: '0 auto' }}>
            This has already been completed. Nothing further is needed from you.
          </p>
        </main>
      </div>
    );
  }

  return (
    <RaterAssessmentFlow
      token={token}
      leaderName={rater.leaderName}
      orgName={rater.orgName}
      raterGroup={rater.raterGroup}
      pillars={getPublic360Assessment(rater.raterGroup, rater.leaderName)}
    />
  );
}
