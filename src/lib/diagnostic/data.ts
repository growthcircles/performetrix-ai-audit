export const DIMENSION_ORDER = [
  'vision',
  'criteria',
  'manager',
  'accountability',
  'culture',
];

export const DIMENSIONS = [
  {
    key: 'vision',
    name: 'Vision and strategy',
    description:
      'To what extent is there a clear vision about how AI can enhance organisational performance?',
    questions: [
      {
        key: 'vision-1',
        text:
          'A manager explains to their team, in their own words, why they are or are not using AI for a task.',
      },
      {
        key: 'vision-2',
        text:
          'A team checks organisational direction before deciding how to use AI.',
      },
      {
        key: 'vision-3',
        text:
          'Leadership updates the AI direction when context changes.',
      },
    ],
  },
  {
    key: 'criteria',
    name: 'Criteria and goals',
    description:
      'To what extent is there clarity and frameworks for evaluating AI-assisted employee performance?',
    questions: [
      {
        key: 'criteria-1',
        text:
          'A manager raises a quality concern about AI-assisted work that looks off.',
      },
      {
        key: 'criteria-2',
        text:
          'A manager applies the same quality judgement to AI-assisted and human-only work.',
      },
      {
        key: 'criteria-3',
        text:
          'Performance goals account for AI use at all.',
      },
    ],
  },
  {
    key: 'manager',
    name: 'Manager capability',
    description:
      'To what extent do managers have the skills and tools to coach people around responsible use of AI with human oversight?',
    questions: [
      {
        key: 'manager-1',
        text:
          'A manager coaches a co-worker on AI use during the work, not just at review time.',
      },
      {
        key: 'manager-2',
        text:
          'A manager asks a co-worker to explain their reasoning when AI-assisted work goes to review.',
      },
      {
        key: 'manager-3',
        text:
          'A manager can state what AI did and did not do during a review.',
      },
    ],
  },
  {
    key: 'accountability',
    name: 'Accountability and guardrails',
    description:
      'To what extent is there clear accountability for AI-driven decisions, and guardrails that define acceptable use and what happens when things go wrong?',
    questions: [
      {
        key: 'accountability-1',
        text:
          'A decision involving AI has a named human owner.',
      },
      {
        key: 'accountability-2',
        text:
          'An AI guardrail is enforced, not just documented and ignored.',
      },
      {
        key: 'accountability-3',
        text:
          'A named person takes responsibility when AI-related work goes wrong, rather than deflecting onto the AI.',
      },
    ],
  },
  {
    key: 'culture',
    name: 'Culture and trust',
    description:
      'To what extent is there a culture where people use AI openly, leaders model responsible use, and responsible AI usage is embedded across the organisation?',
    questions: [
      {
        key: 'culture-1',
        text:
          'Teams openly discuss what AI did and did not do in a deliverable, and whether it changed anything.',
      },
      {
        key: 'culture-2',
        text:
          'People share AI usage openly in team settings rather than privately.',
      },
      {
        key: 'culture-3',
        text:
          'Leaders demonstrate AI use in front of their team and explain it.',
      },
    ],
  },
];

export const MATURITY_BANDS = [
  {
    key: 'ad-hoc',
    name: 'Ad hoc',
    rangeLabel: '0-39',
    description:
      'No shared position on AI yet. Performance is managed case by case, and managers improvise as AI use shows up.',
    nextStep: null,
  },
  {
    key: 'reactive',
    name: 'Reactive',
    rangeLabel: '40-59',
    description:
      'Problems are handled as they arise. Trust and guardrails lag behind how AI is actually being used.',
    nextStep: null,
  },
  {
    key: 'building',
    name: 'Building',
    rangeLabel: '60-74',
    description:
      'Criteria and training are taking shape, but they are not yet part of everyday performance conversations.',
    nextStep: null,
  },
  {
    key: 'embedded',
    name: 'Embedded',
    rangeLabel: '75-89',
    description:
      'Guardrails and frameworks are in regular use. The remaining work is consistency across teams and levels.',
    nextStep: null,
  },
  {
    key: 'leading',
    name: 'Leading',
    rangeLabel: '90-100',
    description:
      'Responsible AI use is embedded, and the organisation keeps refining how performance is judged as AI changes.',
    nextStep: null,
  },
];

export function bandForScore(score: number) {
  if (score >= 90) return MATURITY_BANDS[4];
  if (score >= 75) return MATURITY_BANDS[3];
  if (score >= 60) return MATURITY_BANDS[2];
  if (score >= 40) return MATURITY_BANDS[1];
  return MATURITY_BANDS[0];
}

export function dimensionForKey(key: string) {
  return DIMENSIONS.find((d) => d.key === key);
}

export const PRIORITY_THRESHOLD = 80;

export const DIMENSION_IMPACT: Record<string, Record<string, string>> = {
  vision: {
    '61-80':
      'AI direction is discussed but not consistently applied. Some teams know what AI is for; others improvise, so performance comparisons across teams are unreliable.',
    '0-60':
      'No shared answer to what AI is for. Teams improvise independently, quality is inconsistent, and there is no way to measure whether AI investment is producing results.',
  },
  criteria: {
    '61-80':
      'Quality standards for AI-assisted work exist in places but are not applied consistently. Reviews can drift towards personal preference, and two managers may judge similar work differently.',
    '0-60':
      'No agreed standard for what good AI-assisted work looks like. Reviews become subjective, rating disputes go unresolved, and two managers can judge the same work differently.',
  },
  manager: {
    '61-80':
      'Managers can coach AI use in some situations but not reliably across the team. Coaching happens at review time more than during the work.',
    '0-60':
      'Managers cannot coach their teams on AI use or judge whether output is good. Poor work passes review, good work gets questioned, and people learn to game the process.',
  },
  accountability: {
    '61-80':
      'Accountability is named for some AI-driven decisions but not all. When things go wrong, responsibility is usually clear, but not always.',
    '0-60':
      'Nobody owns AI-driven decisions. When something goes wrong, a poor call or a compliance issue, there is no clear answer to who was responsible.',
  },
  culture: {
    '61-80':
      'AI use is discussed openly in some teams but not all. Leaders model responsible use occasionally, and the organisation learns from some of what is happening.',
    '0-60':
      'People hide their AI use. Leaders do not model it openly, so teams do not either, and the organisation never learns what is actually happening.',
  },
};

export const DIMENSION_STRENGTH: Record<string, string> = {
  vision:
    'There is a shared view of what AI is for, and teams use it to guide decisions rather than improvise. That gives you a coherent basis for comparing performance across teams.',
  criteria:
    'Quality standards for AI-assisted work are agreed and applied consistently, so reviews rest on evidence rather than personal preference.',
  manager:
    'Managers can judge AI-assisted work and coach the reasoning behind it, so quality is maintained as AI use spreads.',
  accountability:
    'Ownership is clear and guardrails are enforced, so risk is bounded and decisions can be traced back.',
  culture:
    'People discuss AI use openly and leaders model it, so the organisation learns from what is actually happening.',
};
