/**
 * Builder
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

const Machine = require('./Machine');
const SourceParser = require('./SourceParser');
const DebugMixin = require('../lib/DebugMixin');

// source reference types
const sourceTypes = {
  URL: 'url',
  GIT: 'git',
  LOCAL_FILE: 'local_file'
};

class Builder {

  constructor() {
    DebugMixin.call(this);

    // tokenized source
    this._source = [];
  }

  /**
   * Build
   * @param {string} content
   * @return {Promise}
   */
  build(content) {

    return new Promise((resolve, reject) => {
      // create machine
      this._machine = new Machine();

      // parse contents
      const parser = new SourceParser();
      parser.sourceName = 'main';
      this._machine.source = parser.parse(content);

      resolve();
    });
  }

  _execute() {

  }

  /**
   * Determine type of source reference
   * @param {string} source
   * @return {string}
   * @private
   */
  _getSourceType(source) {
    if (/^https?:/i.test(source)) {
      return sourceTypes.URL;
    } else if (/\.git\b/i.test(source)) {
      return sourceTypes.GIT;
    } else {
      return sourceTypes.LOCAL_FILE;
    }
  }

  // <editor-fold desc="accessors" defaultstate="collapsed">

  get localFileSearchDirs() {
    return this._localFileSearchDirs || [];
  }

  set localFileSearchDirs(value) {
    this._localFileSearchDirs = value;
  }

  get sourceName() {
    return this._sourceName || 'main';
  }

  set sourceName(value) {
    this._sourceName = value;
  }

  // </editor-fold>
}

module.exports = Builder;
module.exports.sourceTypes = sourceTypes;
