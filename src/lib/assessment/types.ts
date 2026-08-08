// Plain type definitions only, no runtime code and no 'server-only' import
// - safe to import from Client Components. Keeps the session shape shared
// between the client stepper and the server-only scoring module without
// pulling scoring/scoring-key code into the client bundle.

export type ForcedAnswer = Record<string, number>;
export type Session = Record<string, ForcedAnswer[] | (string | null)[]>;

// Sanitized shapes safe to send to the client: statement/scenario/option
// text and structure, with the sub-dimension scoring key stripped out.
export type PublicForcedBlock = Record<string, string>;
export type PublicOption = { key: string; text: string };
export type PublicScenario = { context: string; options: PublicOption[] };
export type PublicPillar = {
  key: string;
  name: string;
  type: 'forced' | 'scenario';
  dims: string[];
  blocks?: PublicForcedBlock[];
  scenarios?: PublicScenario[];
};
