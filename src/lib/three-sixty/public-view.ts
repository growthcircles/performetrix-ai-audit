import 'server-only';
import { PILLARS, itemsForPillar } from './data';
import type { RaterGroup, PublicPillar } from './types';

// The one seam deciding what reaches the client bundle: resolves
// self-vs-other wording and substitutes the leader's name, strips internal
// pillar/dim keys off individual items (grouping is carried by the pillar
// itself), and returns nothing a rater couldn't already infer from the form.
export function getPublic360Assessment(raterGroup: RaterGroup, leaderName: string): PublicPillar[] {
  const isSelf = raterGroup === 'self';
  return PILLARS.map((pillar) => ({
    key: pillar.key,
    name: pillar.name,
    items: itemsForPillar(pillar.key).map((item) => ({
      id: item.id,
      text: (isSelf ? item.textSelf : item.textOther).replaceAll('{{name}}', leaderName),
    })),
    openPrompt: (isSelf ? pillar.openPromptSelf : pillar.openPromptOther).replaceAll('{{name}}', leaderName),
  }));
}
