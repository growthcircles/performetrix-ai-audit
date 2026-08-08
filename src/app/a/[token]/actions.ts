'use server';

import { submitAssessment, type SubmitResult } from '@/lib/data/assessment';
import type { Session } from '@/lib/assessment/types';

export async function submitAssessmentAction(token: string, session: Session): Promise<SubmitResult> {
  return submitAssessment(token, session);
}
