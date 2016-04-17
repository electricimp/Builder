/**
 * Abstract Reader
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

// <editor-fold desc="Errors" defaultstate="collapsed">
const Errors = {};

Errors.NotFoundError = class NotFoundError extends Error {
};
// </editor-fold>

class AbstractReader {
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
