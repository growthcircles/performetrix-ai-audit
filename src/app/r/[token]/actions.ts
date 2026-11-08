'use server';

import { submitRaterAssessment, type SubmitRaterResult } from '@/lib/data/three-sixty';
import type { Session } from '@/lib/three-sixty/types';

export async function submitRaterAssessmentAction(token: string, session: Session): Promise<SubmitRaterResult> {
  return submitRaterAssessment(token, session);
}
