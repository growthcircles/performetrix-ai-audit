import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/data/auth';
import { getSampleScores } from '@/lib/assessment/sample';
import ReportView from '@/components/report/ReportView';

export default async function SampleReportPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'chro') redirect('/');

  return (
    <ReportView
      leaderName="Sample Leader (preview)"
      orgName="Sample Organisation"
      chroName="Sample CHRO"
      scores={getSampleScores()}
      isPreview
      backHref="/chro"
    />
  );
}
