/**
 * Abstract Reader
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

const path = require('path');

// <editor-fold desc="Errors" defaultstate="collapsed">
const Errors = {};

Errors.SourceReadingError = class SourceReadingError extends Error {
};
// </editor-fold>

class AbstractReader {

  /**
   * Read source
   * @param {string} source
   * @return {string}
   */
  read(source) {
  }

  /**
   * Determine if the reader supports the source
   * @param source
   * @return {boolean}
   */
  supports(source) {
    return false;
  }

  /**
   * Parse source path into __FILE__/__PATH__
   * @param {string} source
   * @private
   * @return {{__FILE__, __PATH__}}
   */
  parsePath(source) {
    // file
    const __FILE__ = path.basename(source);

    // path
    let __PATH__ = path.dirname(source);
    __PATH__ = path.normalize(__PATH__);
    if (__PATH__ === '.') __PATH__ = '';

    return {__FILE__, __PATH__};
  }

  /**
   * @return {{debug(),info(),warning(),error()}}
   */
  get logger() {
    return this._logger || {
        debug: console.log,
        info: console.info,
        warning: console.warning,
        error: console.error
      };
  }

  /**
   * @param {{debug(),info(),warning(),error()}} value
   */
  set logger(value) {
    this._logger = value;
  }
}

module.exports = AbstractReader;
module.exports.Errors = Errors;
