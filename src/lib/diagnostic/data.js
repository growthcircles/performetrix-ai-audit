const path = require('path');

const DIMENSION_ORDER = [
  'vision',
  'criteria',
  'manager',
  'accountability',
  'culture',
];

const DIMENSIONS = [
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

const MATURITY_BANDS = [
  {
    key: 'ad-hoc',
    name: 'Ad hoc',
    rangeLabel: '0-39',
    description:
      'No clear position yet. Leaders and managers are improvising as AI use shows up.',
    nextStep:
      'Start a leadership conversation about what AI is for in this organisation before anyone else does. Define one shared purpose for AI use and publish it.',
  },
  {
    key: 'reactive',
    name: 'Reactive',
    rangeLabel: '40-59',
    description:
      'Fixing rating disputes and distrust as they come up. Trust and guardrails lag behind use.',
    nextStep:
      'Draft a working set of criteria and goals, then train managers before embedding anything. Reacting costs more than preparing.',
  },
  {
    key: 'building',
    name: 'Building',
    rangeLabel: '60-74',
    description:
      'Criteria and training drafted, not yet embedded in normal practice.',
    nextStep:
      'Embed the criteria into real review conversations. Make guardrails part of regular practice rather than a document that lives in a folder.',
  },
  {
    key: 'embedded',
    name: 'Embedded',
    rangeLabel: '75-89',
    description:
      'Guardrails and frameworks in regular use, still maturing into habit.',
    nextStep:
      'Shift to leading mode: run continuous refinement loops, embed responsible-AI culture, and tighten accountability for outcomes.',
  },
  {
    key: 'leading',
    name: 'Leading',
    rangeLabel: '90-100',
    description:
      'Continuously refining, with a culture of responsible AI usage across the organisation.',
    nextStep:
      'Formalise a continuous improvement loop. Share what is learned, retire what no longer fits, and keep the whole system evolving.',
  },
];

function bandForScore(score) {
  if (score >= 90) return MATURITY_BANDS[4];
  if (score >= 75) return MATURITY_BANDS[3];
  if (score >= 60) return MATURITY_BANDS[2];
  if (score >= 40) return MATURITY_BANDS[1];
  return MATURITY_BANDS[0];
}

function dimensionForKey(key) {
  return DIMENSIONS.find((d) => d.key === key);
}

module.exports = {
  DIMENSION_ORDER,
  DIMENSIONS,
  MATURITY_BANDS,
  bandForScore,
  dimensionForKey,
};
