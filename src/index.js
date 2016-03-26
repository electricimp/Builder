/**
 * Builder
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

const fs = require('fs');
const c = require('colors');
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
    let lines = this._readSource(source).split('\n');

    for (const line of lines) {

    }
  }

  /**
   * Read source reference
   * @param source
   * @return {string}
   * @private
   */
  _readSource(source) {
      let reader;
      const sourceType = this._getSourceType(source);

      switch (sourceType) {
        case SOURCE_TYPE_LOCAL_FILE:
          reader = new LocalFileReader();
          reader.debug = this.debug;
          reader.searchDirs = reader.searchDirs.concat(this.localFileSearchDirs);
          return reader.read(source);

        default:
          throw new Error('Unknown source type');
      }
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
