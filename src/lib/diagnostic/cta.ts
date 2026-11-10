import { bandForScore } from './data';

export type CtaDimension = { name: string; score: number };

function entry(d: CtaDimension): string {
  return `${d.name} (${d.score}, ${bandForScore(d.score).name})`;
}

function list(items: CtaDimension[]): string {
  return items.map(entry).join('; ');
}

export function buildCta({
  organisation,
  dimensions,
}: {
  organisation: string;
  dimensions: CtaDimension[];
}): { title: string; body: string } {
  const below = [...dimensions].filter((d) => d.score < 75).sort((a, b) => a.score - b.score);
  const above = [...dimensions].filter((d) => d.score >= 75).sort((a, b) => b.score - a.score);

  if (below.length === 0) {
    return {
      title: 'Every dimension sits in the Embedded or Leading band.',
      body: `That is a strong position, and it is one view from the top. Whether managers and employees see the same thing is a separate question, and it is usually where the difference between the reported picture and the lived one shows up. A short conversation can test that, and set out what it would take to keep this position as AI use changes. If you would like to discuss what these findings mean for ${organisation}, book a call.`,
    };
  }

  const counts = ['', 'One', 'Two', 'Three', 'Four', 'Five'];
  const title =
    below.length === dimensions.length
      ? 'All five dimensions sit below the Building band.'
      : `${counts[below.length]} of five dimensions sit below the Building band.`;

  const strong =
    above.length === 1
      ? `${entry(above[0])} is at or above it.`
      : above.length > 1
      ? `${list(above)} are at or above it.`
      : 'No dimension is at or above it.';

  return {
    title,
    body: `They are: ${list(below)}. ${strong} If you would like to discuss what these findings mean for ${organisation}, book a call.`,
  };
}
