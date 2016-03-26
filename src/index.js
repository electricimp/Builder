/**
 * Builder
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

const fs = require('fs');
const c = require('colors');
const Errors = require('./Errors');
const DebugMixin = require('../lib/DebugMixin');
const LocalFileReader = require('./LocalFileReader');

const SOURCE_TYPE_URL = 'url';
const SOURCE_TYPE_GIT = 'git';
const SOURCE_TYPE_LOCAL_FILE = 'local_file';

class ImpBuilder {

  constructor() {
    DebugMixin.call(this);
  }

  /**
   * Build a source reference
   *
   * @param {string} source Importable source reference
   * @return {Promise}
   */
  build(source) {
    return this._readSource(source);
  }

  /**
   * Read source reference
   * @param source
   * @return {Promise}
   * @private
   */
  _readSource(source) {
    return new Promise((resolve, reject) => {
      let reader;
      const sourceType = this._getSourceType(source);

      switch (sourceType) {
        case SOURCE_TYPE_LOCAL_FILE:
          reader = new LocalFileReader();
          reader.debug = this.debug;
          reader.searchDirs = reader.searchDirs.concat(this.localFileSearchDirs);
          resolve(reader.read(source));
          break;

        default:
          reject(new Error('Unknown source type'));
          break;
      }
    });
  }

  /**
   * Determine type of source reference
   * @param {string} ref
   * @return {string}
   * @private
   */
  _getSourceType(ref) {
    if (/^https?:/i.test(ref)) {
      return SOURCE_TYPE_URL;
    } else if (/\.git\b/i.test(ref)) {
      return SOURCE_TYPE_GIT;
    } else {
      return SOURCE_TYPE_LOCAL_FILE;
    }
  }

  // <editor-fold desc="accessors" defaultstate="collapsed">

  get localFileSearchDirs() {
    return this._localFileSearchDirs || [];
  }

  set localFileSearchDirs(value) {
    this._localFileSearchDirs = value;
  }

  // </editor-fold>
}

module.exports = ImpBuilder;
module.exports.Errors = Errors;
