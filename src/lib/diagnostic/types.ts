// Plain type definitions only, no runtime code and no 'server-only' import
// - safe to import from Client Components.

export type DimensionKey =
  | 'vision'
  | 'criteria'
  | 'manager'
  | 'accountability'
  | 'culture';

export type Question = {
  key: string;
  text: string;
};

export type Dimension = {
  key: DimensionKey;
  name: string;
  description: string;
  questions: Question[];
};

export type Answer = Record<string, number>; // questionKey -> 1-5

export type DimensionScore = {
  key: DimensionKey;
  name: string;
  score: number;        // 1-5 mean of its three questions
  band: MaturityBand;
};

export type MaturityBand = {
  key: string;
  name: string;
  rangeLabel: string;
  description: string;
  nextStep: string;
};

export type DiagnosticResult = {
  dimensions: DimensionScore[];
  overall: number;      // mean of the five dimension scores
  band: MaturityBand;
  answeredAt: string;
};