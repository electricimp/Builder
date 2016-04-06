/**
 * Local file reader
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

const fs = require('fs');
const path = require('path');

class FileReader {

  constructor() {
    this.searchDirs = [
      path.resolve('.')
    ];
  }

  /**
   * Read local file
   * @param {string} path
   * @return {string}
   */
  read(path) {
    // iterate through the search dirs
    for (const dir of this.searchDirs) {
      const sourcePath = dir + '/' + path;

      if (fs.existsSync(sourcePath)) {
        this.logger.debug(`Reading local file "${sourcePath}"`);
        return fs.readFileSync(sourcePath, 'utf-8');
      }
    }

    throw new Error('Local file "' + path + '" not found');
  }

  // <editor-fold desc="Accessors" defaultstate="collapsed">

  get searchDirs() {
    return this._searchDirs || [];
  }

  set searchDirs(value) {
    this._searchDirs = value;
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

  // </editor-fold>
}

module.exports = FileReader;
