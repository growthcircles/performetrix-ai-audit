import 'server-only';

// Canonical assessment content, lifted from PerforMetrix_Prototype.html. This
// module includes the scoring key (option -> sub-dimension values), so it
// must never be imported into a Client Component - the `server-only` import
// above turns that into a build error instead of a silent leak. Pages
// derive a sanitized "public view" (see public-view.ts) before passing
// anything to the client.

export type Dim = string;

export type ForcedBlock = Record<Dim, string>;

export type ScenarioOption = {
  key: string;
  text: string;
  dims: Record<Dim, number>;
};

export type Scenario = {
  context: string;
  options: ScenarioOption[];
};

export type Pillar = {
  key: string;
  name: string;
  type: 'forced' | 'scenario';
  dims: Dim[];
  dimLabels: Record<Dim, string>;
  blocks?: ForcedBlock[];
  scenarios?: Scenario[];
};

export const SUCCESSION: Pillar = {
  key: 'succession',
  name: 'Succession-Ready',
  type: 'forced',
  dims: ['ownership', 'decisiveness', 'development'],
  dimLabels: { ownership: 'Ownership', decisiveness: 'Decisiveness', development: 'Development of Others' },
  blocks: [
    {
      ownership: "I make decisions that technically require my manager's sign-off, then inform them afterward with full context.",
      decisiveness: 'When a brief is incomplete, I set a direction and move, rather than sending it back for more clarity.',
      development: 'I give stretch opportunities to junior team members and let them present their own work to leadership.',
    },
    {
      ownership: "When something goes wrong on a project I lead, I'm the first to name what I could have done differently, before anyone asks.",
      decisiveness: "I'll commit to a course of action with about 70% of the information I'd ideally want, rather than waiting for more.",
      development: 'I deliberately step back from a decision I could easily make myself, so someone on my team can make it instead.',
    },
  ],
};

export const GLOBAL: Pillar = {
  key: 'global',
  name: 'Globally-Ready',
  type: 'forced',
  dims: ['adaptation', 'curiosity', 'awareness'],
  dimLabels: { adaptation: 'Deliberate Adaptation', curiosity: 'Curiosity about Norms', awareness: 'Self-Awareness of Assumptions' },
  blocks: [
    {
      adaptation: "I slow down and check for understanding in meetings with colleagues who aren't communicating in their first language, without being asked.",
      curiosity: 'Before changing how a team in another market operates, I ask why they currently do it that way.',
      awareness: "I catch myself when I'm applying an assumption from my home market to a different market, and check it with someone local.",
    },
    {
      adaptation: 'I adjust how directly I give feedback depending on the cultural background of the person I\'m speaking to.',
      curiosity: "When something in another market's way of working confuses me, my first instinct is to ask about it rather than assume it's inefficient.",
      awareness: 'I notice when a decision I\'m about to make would look different if I were leading from a different regional office, and I factor that in.',
    },
  ],
};

export const JUDGMENT: Pillar = {
  key: 'judgment',
  name: 'Judgment-Ready',
  type: 'scenario',
  dims: ['decisiveness', 'feedback', 'values'],
  dimLabels: { decisiveness: 'Decisiveness under Ambiguity', feedback: 'Feedback-Loop Building', values: 'Values-Anchoring' },
  scenarios: [
    {
      context:
        "You lead a division of 400 people. Finance flags that a long-standing client, worth 12% of divisional revenue, has requested a pricing exception outside normal approval limits, with a decision needed within 14 hours. The client's finance director has been a reliable partner for six years. Your Head of Finance recommends against the exception on margin grounds. Your CRM data shows the client has been quoted by two competitors in the last quarter. There is no policy covering exceptions of this size.",
      options: [
        { key: 'A', text: 'Approve the exception at the level requested, and instruct Finance to model the margin impact over the following week.', dims: { decisiveness: 3, feedback: 1, values: 2 } },
        { key: 'B', text: 'Approve a partial exception, roughly half the requested reduction, and offer to revisit in a formal review within 30 days.', dims: { decisiveness: 3, feedback: 3, values: 2 } },
        { key: 'C', text: 'Decline the exception as requested, but offer an alternative structure, extended payment terms instead of a price reduction, within the 14 hour window.', dims: { decisiveness: 3, feedback: 1, values: 3 } },
        { key: 'D', text: 'Ask the client for 48 hours, using the extra time to get a same-day view from your CFO before committing either way.', dims: { decisiveness: 1, feedback: 1, values: 1 } },
      ],
    },
    {
      context:
        "You've been made aware that a peer at your level has, on three occasions over the past year, approved supplier contracts that fall within their formal sign-off authority but sit outside guidance the organisation issued eighteen months ago on supplier diversity. No policy breach has occurred. One instance was raised informally by a junior team member who has since moved to a different department. You have a scheduled one to one with this peer in four days, and a broader leadership meeting in ten days where quarterly supplier data is normally reviewed.",
      options: [
        { key: 'A', text: 'Use the scheduled one to one in four days to raise it directly with your peer.', dims: { decisiveness: 3, feedback: 2, values: 3 } },
        { key: 'B', text: 'Contact HR or the relevant governance function before the one to one, to understand whether this has been flagged before.', dims: { decisiveness: 2, feedback: 3, values: 3 } },
        { key: 'C', text: 'Wait for the leadership meeting in ten days and raise it through the standard supplier data review, where it will surface as part of normal reporting.', dims: { decisiveness: 1, feedback: 1, values: 1 } },
        { key: 'D', text: 'Speak first to the junior team member who originally raised it informally, to understand what they observed before taking further action.', dims: { decisiveness: 2, feedback: 2, values: 2 } },
      ],
    },
  ],
};

export const RELATIONSHIP: Pillar = {
  key: 'relationship',
  name: 'Relationship-Ready',
  type: 'scenario',
  dims: ['consistency', 'surfacing', 'individual'],
  dimLabels: { consistency: 'Consistency and Trust', surfacing: 'Early-Surfacing', individual: 'Individual Responsiveness' },
  scenarios: [
    {
      context:
        'A senior direct report has missed a critical deadline for the second time this quarter. Their explanation cites a dependency delay from another team, but a quick check shows that dependency was resolved five days before the deadline passed. Three other team members are aware of the missed deadline and are waiting to see how you respond. You have a standing one to one with this person tomorrow, and a wider team update is due in two days.',
      options: [
        { key: 'A', text: "Address it directly in tomorrow's one to one, ask the direct report to walk you through the five days between the dependency being resolved and the deadline passing, and decide next steps based on what you learn.", dims: { consistency: 3, surfacing: 2, individual: 3 } },
        { key: 'B', text: "Address it now, before tomorrow's one to one, given three other team members are already watching how you respond.", dims: { consistency: 1, surfacing: 3, individual: 1 } },
        { key: 'C', text: 'Wait until the wider team update in two days, and address the pattern at that point in a way that sets a standard for everyone, not just this person.', dims: { consistency: 2, surfacing: 1, individual: 1 } },
        { key: 'D', text: 'Ask one of the three team members privately for their read on what happened before speaking to the direct report.', dims: { consistency: 1, surfacing: 2, individual: 1 } },
      ],
    },
    {
      context:
        'A newer team member on a global team has been quiet in the last three team meetings, contributing only when asked directly. Their written contributions in shared documents are strong. A colleague mentions offhand that this person "doesn\'t say much." You don\'t have a one to one scheduled with them for another two weeks.',
      options: [
        { key: 'A', text: 'Set up an earlier one to one this week to check in, without stating a specific concern in the invite.', dims: { consistency: 2, surfacing: 3, individual: 3 } },
        { key: 'B', text: "Raise it in the next team meeting by inviting broader input from everyone, so it doesn't single anyone out.", dims: { consistency: 1, surfacing: 2, individual: 1 } },
        { key: 'C', text: 'Wait for the scheduled one to one in two weeks, since the written work shows they\'re contributing fine.', dims: { consistency: 2, surfacing: 1, individual: 1 } },
        { key: 'D', text: 'Ask the colleague who mentioned it to keep an informal eye on things and flag anything further.', dims: { consistency: 1, surfacing: 2, individual: 1 } },
      ],
    },
  ],
};

export const PILLAR_ORDER: Pillar[] = [SUCCESSION, GLOBAL, JUDGMENT, RELATIONSHIP];

export function pillarByKey(key: string): Pillar | undefined {
  return PILLAR_ORDER.find((p) => p.key === key);
}

export const IMPACT: Record<string, string> = {
  succession:
    'A gap here signals succession risk. The next generation of leaders may not be ready to step into bigger roles when the organisation needs them to, which shows up as slower bench strength and more external hiring under pressure.',
  judgment:
    'A gap here signals exposure in ambiguous, fast-moving situations, particularly as AI reshapes decisions that used to have clear precedent. Leaders default to deferring or stalling exactly when speed and ownership matter most.',
  relationship:
    'A gap here signals erosion risk on trust and psychological safety. Research increasingly ties this to how people are relating to AI versus their human leaders, and it shows up as problems surfacing late rather than early.',
  global:
    "A gap here signals risk in cross-cultural and multinational contexts, as roles increasingly span markets and teams that don't share one cultural default. It shows up as friction and lost trust across regional lines.",
};

export const SUBDIM_DESC: Record<string, Record<string, string>> = {
  succession: {
    ownership: 'Takes accountability for outcomes above their formal role, without waiting to be asked.',
    decisiveness: 'Sets direction and moves with an incomplete brief, rather than sending it back for more clarity.',
    development: 'Builds capability in others, rather than holding every decision themselves.',
  },
  judgment: {
    decisiveness: 'Makes a real call under ambiguity, rather than deferring it upward or waiting for more certainty.',
    feedback: 'Builds a short review point into the decision itself, so a wrong call gets caught fast.',
    values: "Holds a values-based line even when there's no policy forcing the point.",
  },
  relationship: {
    consistency: 'Responds the same way under pressure as they do day to day, so people know what to expect.',
    surfacing: "Creates the conditions where problems get raised early, not once they're unavoidable.",
    individual: 'Adjusts to the specific person in front of them, rather than using one style for everyone.',
  },
  global: {
    adaptation: 'Adjusts communication style for different cultural contexts, without being asked to.',
    curiosity: "Asks why a norm exists before changing it, rather than assuming it's inefficient.",
    awareness: 'Notices when a home-market assumption is shaping a decision, and checks it against the room.',
  },
};

