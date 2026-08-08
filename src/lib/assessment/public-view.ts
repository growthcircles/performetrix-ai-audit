import 'server-only';
import { PILLAR_ORDER } from './data';
import type { PublicPillar } from './types';

export type { PublicPillar };

// What the leader's browser is allowed to see: statement/scenario/option
// text and structure, with the sub-dimension scoring key stripped out.
// Imported by the page (a Server Component) to build props for the client
// stepper - never import `data.ts` directly into a Client Component.
export function getPublicAssessment(): PublicPillar[] {
  return PILLAR_ORDER.map((pillar) => ({
    key: pillar.key,
    name: pillar.name,
    type: pillar.type,
    dims: pillar.dims,
    blocks: pillar.blocks,
    scenarios: pillar.scenarios?.map((s) => ({
      context: s.context,
      options: s.options.map((o) => ({ key: o.key, text: o.text })),
    })),
  }));
}
