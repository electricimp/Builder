/**
 * Builder
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

const DebugMixin = require('../lib/DebugMixin');
const LocalFileReader = require('./LocalFileReader');
const SourceParser = require('./SourceParser');

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

      // parse contents
      const parser = new SourceParser();
      parser.sourceName = 'main';
      this._source = parser.parse(content);

      resolve();
    });
  }

  _execute() {
    //
  }

  /**
   * Read source reference
   * @param source
   * @return {string}
   * @private
   */
  _readSource(source) {
    const sourceType = this._getSourceType(source);

    switch (sourceType) {
      case sourceTypes.LOCAL_FILE:
        const reader = new LocalFileReader();
        reader.debug = this.debug;
        reader.searchDirs = reader.searchDirs.concat(this.localFileSearchDirs);
        return reader.read(source);

      default:
        throw new Error('Unsupported source reference type');
    }
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
