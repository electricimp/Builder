// Copyright (c) 2016-2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

const url = require('url');
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

    const __FILE__ = path.basename(source);
    let __PATH__;

    let parsedURL = url.parse(source);
    if (parsedURL.protocol) {
      // URL
      __PATH__ = path.dirname(source);
    } else {
      // path
      __PATH__ = path.normalize(path.dirname(source));
      if (__PATH__ === '.') {
        __PATH__ = '';
      }
    }

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
