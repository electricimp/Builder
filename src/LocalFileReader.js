/**
 * Local file reader
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

const fs = require('fs');
const c = require('colors');
const path = require('path');
const DebugMixin = require('../lib/DebugMixin');

class LocalFileReader {

  constructor() {
    DebugMixin.call(this);
    this.searchDirs = [
      path.resolve('.')
    ];
  }

  /**
   * @param {string} source
   * @return {string}
   */
  read(source) {
      // iterate through the search dirs
      for (const dir of this.searchDirs) {
        const sourcePath = dir + '/' + source;

        if (fs.existsSync(sourcePath)) {
          this._debug(c.blue('Reading local source file ') + sourcePath);
          return fs.readFileSync(sourcePath, 'utf-8');
        }
      }

      throw new Error('Local file "' + source + '" not found');
  }

  // <editor-fold desc="Accessors" defaultstate="collapsed">

  get searchDirs() {
    return this._searchDirs;
  }

  set searchDirs(value) {
    this._searchDirs = value;
  }

  // </editor-fold>
}

module.exports = LocalFileReader;
