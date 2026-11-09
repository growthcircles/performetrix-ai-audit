export type CtaDimension = { name: string };

function listNames(items: CtaDimension[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0].name;
  if (items.length === 2) return `${items[0].name} and ${items[1].name}`;
  return items.slice(0, -1).map((i) => i.name).join(', ') + ' and ' + items[items.length - 1].name;
}

export function buildCta({
  organisation,
  flagged,
  healthy,
}: {
  organisation: string;
  flagged: CtaDimension[];
  healthy: CtaDimension[];
}): { title: string; body: string } {
  if (flagged.length === 0) {
    return {
      title: 'Your results are strong. The question is whether they hold up.',
      body: `All five dimensions sit above the priority threshold. That is a good position to be in. It is also one view, from the top. Whether managers and employees experience the same thing is a separate question, and it is usually where the difference between the reported picture and the lived one shows up. A short conversation can test that, and set out what it would take to keep this position as AI use changes.`,
    };
  }

  if (healthy.length > 0) {
    return {
      title: 'Your results show where to focus.',
      body: `${listNames(healthy)} ${healthy.length === 1 ? 'is' : 'are'} holding up. ${listNames(
        flagged,
      )} ${flagged.length === 1 ? 'sits' : 'sit'} below the priority threshold. Closing that gap is where the next gain is, and the strong areas give you a base to build from. If you would like to discuss what these findings mean for ${organisation}, book a call.`,
    };
  }

  return {
    title: 'Your results show gaps that warrant a closer conversation.',
    body: `All five dimensions sit below the priority threshold. That means ${organisation} is exposed across the board, and the implications compound: inconsistent quality, unresolved disputes, unmanaged risk, and blind spots that grow over time. We help organisations close these gaps. If you would like to discuss what these findings mean for ${organisation}, book a call.`,
  };
}

