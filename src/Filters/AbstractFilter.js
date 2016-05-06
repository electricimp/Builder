/**
 * Abstract filer
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

class AbstractFilter {
  /**
   * Apply filter
   * @param {[*]} args
   * @param {string} input
   */
  filter(input, args) {
    return String(input);
  }
}

module.exports = AbstractFilter;
