import 'server-only';

// Canonical content for the PerforMetrix 360 Assessment (v1), source: the
// project's PerforMetrix_360_Assessment_v1.md spec. Same 4 pillars / 12
// sub-dimensions as the diagnostic self-assessment (src/lib/assessment/
// data.ts), reusing its pillar/dim keys so report code can share label
// lookups (SUBDIM_DESC, IMPACT). This module holds both the third-person
// (rater) and first-person (self) wording for every item, so it must never
// reach a Client Component directly - see public-view.ts for the sanitized
// per-rater-group view actually sent to the browser.

import type { PillarKey } from './types';

export type Item = {
  id: string;
  pillarKey: PillarKey;
  dimKey: string;
  textOther: string; // third-person, "{{name}}" placeholder for the leader's name
  textSelf: string; // first-person
};

export type PillarContent = {
  key: PillarKey;
  name: string;
  dims: string[];
  dimLabels: Record<string, string>;
  openPromptOther: string;
  openPromptSelf: string;
};

export const PILLARS: PillarContent[] = [
  {
    key: 'succession',
    name: 'Succession-Ready',
    dims: ['ownership', 'decisiveness', 'development'],
    dimLabels: { ownership: 'Owning Outcomes', decisiveness: 'Acting Early', development: 'Developing Others' },
    openPromptOther: "What's the clearest example you've seen of {{name}} taking ownership, or not, of a decision or outcome beyond their immediate role?",
    openPromptSelf: "What's the clearest example of you taking ownership, or not, of a decision or outcome beyond your immediate role?",
  },
  {
    key: 'judgment',
    name: 'Judgement-Ready',
    dims: ['decisiveness', 'feedback', 'values'],
    dimLabels: { decisiveness: 'Deciding Under Pressure', feedback: 'Catching Mistakes Early', values: 'Standing by Values' },
    openPromptOther: 'Describe a specific situation where {{name}} had to make a call with no clear precedent to follow. What did they actually do?',
    openPromptSelf: 'Describe a specific situation where you had to make a call with no clear precedent to follow. What did you actually do?',
  },
  {
    key: 'relationship',
    name: 'Relationship-Ready',
    dims: ['consistency', 'surfacing', 'individual'],
    dimLabels: { consistency: 'Staying Consistent', surfacing: 'Speaking Up', individual: 'Adapting to People' },
    openPromptOther: "What's the most telling thing you've observed about how {{name}} builds or maintains trust on their team?",
    openPromptSelf: "What's the most telling thing about how you build or maintain trust on your team?",
  },
  {
    key: 'global',
    name: 'Globally-Ready',
    dims: ['adaptation', 'curiosity', 'awareness'],
    dimLabels: { adaptation: 'Adapting Across Cultures', curiosity: 'Staying Curious', awareness: 'Checking Assumptions' },
    openPromptOther: "What's one example of {{name}} adapting, or struggling to adapt, to a different cultural or regional context?",
    openPromptSelf: "What's one example of you adapting, or struggling to adapt, to a different cultural or regional context?",
  },
];

export const ITEMS: Item[] = [
  // Succession-Ready / Owning Outcomes
  { id: 's-own-1', pillarKey: 'succession', dimKey: 'ownership', textOther: "{{name}} signs off on decisions that go beyond their formal authority, and lets their manager know afterward rather than asking permission first.", textSelf: "I sign off on decisions that go beyond my formal authority, and let my manager know afterward rather than asking permission first." },
  { id: 's-own-2', pillarKey: 'succession', dimKey: 'ownership', textOther: "{{name}} takes public responsibility when something goes wrong on their watch, rather than pointing to who else was involved.", textSelf: "I take public responsibility when something goes wrong on my watch, rather than pointing to who else was involved." },
  { id: 's-own-3', pillarKey: 'succession', dimKey: 'ownership', textOther: "{{name}} steps in to resolve a problem that technically belongs to another team or role, without being asked to.", textSelf: "I step in to resolve a problem that technically belongs to another team or role, without being asked to." },
  // Succession-Ready / Acting Early
  { id: 's-act-1', pillarKey: 'succession', dimKey: 'decisiveness', textOther: "{{name}} sets a clear direction for the team even when the brief they were given is incomplete.", textSelf: "I set a clear direction for the team even when the brief I was given is incomplete." },
  { id: 's-act-2', pillarKey: 'succession', dimKey: 'decisiveness', textOther: "{{name}} starts work on a decision before every detail has been confirmed, rather than waiting for full information.", textSelf: "I start work on a decision before every detail has been confirmed, rather than waiting for full information." },
  { id: 's-act-3', pillarKey: 'succession', dimKey: 'decisiveness', textOther: "{{name}} moves a stalled project forward by making a call, rather than escalating it back upward.", textSelf: "I move a stalled project forward by making a call, rather than escalating it back upward." },
  // Succession-Ready / Developing Others
  { id: 's-dev-1', pillarKey: 'succession', dimKey: 'development', textOther: "{{name}} hands a real decision to someone on their team rather than making the call personally.", textSelf: "I hand a real decision to someone on my team rather than making the call personally." },
  { id: 's-dev-2', pillarKey: 'succession', dimKey: 'development', textOther: "{{name}} lets a team member present their own work directly to senior stakeholders, rather than presenting it for them.", textSelf: "I let a team member present their own work directly to senior stakeholders, rather than presenting it for them." },
  { id: 's-dev-3', pillarKey: 'succession', dimKey: 'development', textOther: "{{name}} gives a team member a stretch task that is genuinely difficult for that person, rather than sticking to safe assignments.", textSelf: "I give a team member a stretch task that is genuinely difficult for that person, rather than sticking to safe assignments." },

  // Judgement-Ready / Deciding Under Pressure
  { id: 'j-dec-1', pillarKey: 'judgment', dimKey: 'decisiveness', textOther: "{{name}} makes a clear decision in situations where the right answer isn't obvious, rather than delaying for more information.", textSelf: "I make a clear decision in situations where the right answer isn't obvious, rather than delaying for more information." },
  { id: 'j-dec-2', pillarKey: 'judgment', dimKey: 'decisiveness', textOther: "{{name}} commits to a course of action when time is short, rather than asking for the deadline to be extended.", textSelf: "I commit to a course of action when time is short, rather than asking for the deadline to be extended." },
  { id: 'j-dec-3', pillarKey: 'judgment', dimKey: 'decisiveness', textOther: "{{name}} gives a direct answer when asked for a decision, rather than deferring it to someone more senior.", textSelf: "I give a direct answer when asked for a decision, rather than deferring it to someone more senior." },
  // Judgement-Ready / Catching Mistakes Early
  { id: 'j-fbk-1', pillarKey: 'judgment', dimKey: 'feedback', textOther: "{{name}} sets a specific date or checkpoint to review a decision shortly after making it.", textSelf: "I set a specific date or checkpoint to review a decision shortly after making it." },
  { id: 'j-fbk-2', pillarKey: 'judgment', dimKey: 'feedback', textOther: "{{name}} asks someone to flag early signs that a decision isn't working, rather than waiting to find out later.", textSelf: "I ask someone to flag early signs that a decision isn't working, rather than waiting to find out later." },
  { id: 'j-fbk-3', pillarKey: 'judgment', dimKey: 'feedback', textOther: "{{name}} changes course quickly once new information shows a decision isn't working, rather than sticking with it for the sake of consistency.", textSelf: "I change course quickly once new information shows a decision isn't working, rather than sticking with it for the sake of consistency." },
  // Judgement-Ready / Standing by Values
  { id: 'j-val-1', pillarKey: 'judgment', dimKey: 'values', textOther: "{{name}} turns down a shortcut or opportunity that conflicts with the team's stated values, even when no one would have noticed.", textSelf: "I turn down a shortcut or opportunity that conflicts with the team's stated values, even when no one would have noticed." },
  { id: 'j-val-2', pillarKey: 'judgment', dimKey: 'values', textOther: "{{name}} says no to a request that would be easy to grant but conflicts with what the team has agreed matters.", textSelf: "I say no to a request that would be easy to grant but conflicts with what the team has agreed matters." },
  { id: 'j-val-3', pillarKey: 'judgment', dimKey: 'values', textOther: "{{name}} raises a concern about a decision on principle, even when raising it isn't likely to change the outcome.", textSelf: "I raise a concern about a decision on principle, even when raising it isn't likely to change the outcome." },

  // Relationship-Ready / Staying Consistent
  { id: 'r-con-1', pillarKey: 'relationship', dimKey: 'consistency', textOther: "{{name}} reacts to bad news calmly, the same way whether it's a minor issue or a serious one.", textSelf: "I react to bad news calmly, the same way whether it's a minor issue or a serious one." },
  { id: 'r-con-2', pillarKey: 'relationship', dimKey: 'consistency', textOther: "{{name}} treats people the same way in a high-pressure moment as they do on an ordinary day.", textSelf: "I treat people the same way in a high-pressure moment as I do on an ordinary day." },
  { id: 'r-con-3', pillarKey: 'relationship', dimKey: 'consistency', textOther: "{{name}} keeps their commitments to the team even when things get busy or stressful.", textSelf: "I keep my commitments to the team even when things get busy or stressful." },
  // Relationship-Ready / Speaking Up
  { id: 'r-sur-1', pillarKey: 'relationship', dimKey: 'surfacing', textOther: "{{name}} reacts calmly rather than punitively when someone reports a mistake or brings bad news.", textSelf: "I react calmly rather than punitively when someone reports a mistake or brings bad news." },
  { id: 'r-sur-2', pillarKey: 'relationship', dimKey: 'surfacing', textOther: "{{name}} thanks someone for raising a problem early, rather than reacting with frustration.", textSelf: "I thank someone for raising a problem early, rather than reacting with frustration." },
  { id: 'r-sur-3', pillarKey: 'relationship', dimKey: 'surfacing', textOther: "{{name}} is someone people go to first when something has gone wrong, rather than someone people try to avoid telling.", textSelf: "I am someone people go to first when something has gone wrong, rather than someone people try to avoid telling." },
  // Relationship-Ready / Adapting to People
  { id: 'r-ind-1', pillarKey: 'relationship', dimKey: 'individual', textOther: "{{name}} changes how they give feedback depending on who they're talking to, rather than using one style for everyone.", textSelf: "I change how I give feedback depending on who I'm talking to, rather than using one style for everyone." },
  { id: 'r-ind-2', pillarKey: 'relationship', dimKey: 'individual', textOther: "{{name}} adjusts their communication style noticeably between different team members.", textSelf: "I adjust my communication style noticeably between different team members." },
  { id: 'r-ind-3', pillarKey: 'relationship', dimKey: 'individual', textOther: "{{name}} picks up on when someone needs a different kind of support than usual, and changes their approach accordingly.", textSelf: "I pick up on when someone needs a different kind of support than usual, and change my approach accordingly." },

  // Globally-Ready / Adapting Across Cultures
  { id: 'g-ada-1', pillarKey: 'global', dimKey: 'adaptation', textOther: "{{name}} adjusts their communication style for colleagues from different cultural backgrounds, without being asked to.", textSelf: "I adjust my communication style for colleagues from different cultural backgrounds, without being asked to." },
  { id: 'g-ada-2', pillarKey: 'global', dimKey: 'adaptation', textOther: "{{name}} slows down or rephrases when speaking with colleagues who aren't communicating in their first language.", textSelf: "I slow down or rephrase when speaking with colleagues who aren't communicating in their first language." },
  { id: 'g-ada-3', pillarKey: 'global', dimKey: 'adaptation', textOther: "{{name}} changes how directly they give feedback depending on the cultural norms of the person they're speaking to.", textSelf: "I change how directly I give feedback depending on the cultural norms of the person I'm speaking to." },
  // Globally-Ready / Staying Curious
  { id: 'g-cur-1', pillarKey: 'global', dimKey: 'curiosity', textOther: "{{name}} asks about the reasoning behind an unfamiliar way of doing something, rather than immediately suggesting it change.", textSelf: "I ask about the reasoning behind an unfamiliar way of doing something, rather than immediately suggesting it change." },
  { id: 'g-cur-2', pillarKey: 'global', dimKey: 'curiosity', textOther: "{{name}} asks questions about how a different regional team operates before recommending changes to it.", textSelf: "I ask questions about how a different regional team operates before recommending changes to it." },
  { id: 'g-cur-3', pillarKey: 'global', dimKey: 'curiosity', textOther: "{{name}} takes time to understand a colleague's perspective before disagreeing with it, especially when that colleague has a different cultural background.", textSelf: "I take time to understand a colleague's perspective before disagreeing with it, especially when that colleague has a different cultural background." },
  // Globally-Ready / Checking Assumptions
  { id: 'g-awa-1', pillarKey: 'global', dimKey: 'awareness', textOther: "{{name}} openly says when their usual approach might not fit a situation, and checks it with someone closer to the context.", textSelf: "I openly say when my usual approach might not fit a situation, and check it with someone closer to the context." },
  { id: 'g-awa-2', pillarKey: 'global', dimKey: 'awareness', textOther: "{{name}} asks someone from a different region or background to review a decision before finalising it.", textSelf: "I ask someone from a different region or background to review a decision before finalising it." },
  { id: 'g-awa-3', pillarKey: 'global', dimKey: 'awareness', textOther: "{{name}} changes their original plan after hearing feedback that it doesn't fit a particular market or culture.", textSelf: "I change my original plan after hearing feedback that it doesn't fit a particular market or culture." },
];

export function pillarByKey(key: PillarKey): PillarContent | undefined {
  return PILLARS.find((p) => p.key === key);
}

export function itemsForPillar(key: PillarKey): Item[] {
  return ITEMS.filter((i) => i.pillarKey === key);
}

