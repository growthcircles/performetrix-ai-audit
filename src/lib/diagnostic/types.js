// Plain type definitions only, no runtime code - safe to import anywhere.

/**
 * DimensionKey: one of the five diagnostic dimensions.
 * @type {'vision' | 'criteria' | 'manager' | 'accountability' | 'culture'}
 */

/**
 * Question: one survey question with a key and text.
 * @typedef {Object} Question
 * @property {string} key
 * @property {string} text
 */

/**
 * Dimension: a diagnostic dimension with its questions.
 * @typedef {Object} Dimension
 * @property {string} key
 * @property {string} name
 * @property {string} description
 * @property {Question[]} questions
 */

/**
 * Answer: questionKey -> 1-5 score.
 * @typedef {Record<string, number>} Answer
 */

/**
 * DimensionScore: one dimension's result.
 * @typedef {Object} DimensionScore
 * @property {string} key
 * @property {string} name
 * @property {number} score - normalized 0-100
 * @property {import('./types').MaturityBand} band
 */

/**
 * MaturityBand: one maturity band.
 * @typedef {Object} MaturityBand
 * @property {string} key
 * @property {string} name
 * @property {string} rangeLabel
 * @property {string} description
 * @property {string} nextStep
 */

/**
 * DiagnosticResult: full scoring result.
 * @typedef {Object} DiagnosticResult
 * @property {DimensionScore[]} dimensions
 * @property {number} overall
 * @property {MaturityBand} band
 * @property {string} answeredAt
 */
