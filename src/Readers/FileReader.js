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

const fs = require('fs');
const path = require('path');
const AbstractReader = require('./AbstractReader');

/**
 * Local file reader
 */
class FileReader extends AbstractReader {

  constructor() {
    super();
    this.searchDirs = [
      path.resolve('.')
    ];
  }

  supports(source) {
    // support only local files and not GIT repos
    return !/^https?:/i.test(source) && !/\.git\b/i.test(source);
  }

  /**
   * Read local file
   * @param {string} filePath
   * @return {string}
   */
  read(filePath, options) {

    var searchDirs = this.searchDirs.concat (
      options.context.__PATH__,
      '' /* to try as absolute path */
    )

    // iterate through the search dirs
    for (const dir of searchDirs) {
      const sourcePath = path.join(dir, filePath);

      if (fs.existsSync(sourcePath)) {
        this.logger.debug(`Reading local file "${sourcePath}"`);
          return fs.readFileSync(sourcePath, 'utf-8');
      }
    }

    throw new AbstractReader.Errors.SourceReadingError('Local file "' + path.normalize(filePath) + '" not found');
  }

  // <editor-fold desc="Accessors" defaultstate="collapsed">

  get searchDirs() {
    return this._searchDirs || [];
  }

  set searchDirs(value) {
    this._searchDirs = value;
  }

  // </editor-fold>
}

module.exports = FileReader;
