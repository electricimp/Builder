// MIT License
//
// Copyright 2016-2020 Electric Imp
//
// SPDX-License-Identifier: MIT
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
// EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
// OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

'use strict';

const url = require('url');
const upath = require('upath');

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

    const __FILE__ = upath.basename(source);
    let __PATH__;

    // url parse can find protocol in Windows-style path, so we check it
    if (url.parse(source).protocol && !upath.parse(source).root) {
      // URL
      __PATH__ = upath.dirname(source);
    } else {
      // path
      __PATH__ = upath.normalize(upath.dirname(source));
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
