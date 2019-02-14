/**
 * randomly return true or false
 * @param {number} [probability] the probability to return true, must be a value between 0 and 1 (including 0 and 1)
 *
 * @example
 * ```javascript
 * Mock.Random.boolean(0.9) // true
 * ```
 */
const returnBoolean = (probability?: number): boolean => {
  if (typeof probability === 'undefined') {
    return Math.random() > 0.5
  }

  return Math.random() > (1 - probability)
}

/**
 * randomly return a natural number (0, and positive integer)
 * @param {number} [min]
 * @param {number} [max]
 * 
 * @example
 * ```javascript
 * Mock.Random.natural(10, 20) // 10
 * ```
 */
const natural = (min?: number, max?: number): number => {
  min = typeof min !== 'undefined' ? parseInt('' + min, 10) : 0
  max = typeof max !== 'undefined' ? parseInt('' + max, 10) : 9007199254740992 // 2^53
  return Math.round(Math.random() * (max - min)) + min
}

export default {
  boolean: returnBoolean,
  bool: returnBoolean,

  natural,
}
