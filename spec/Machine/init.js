// Copyright (c) 2016-2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

const fs = require('fs');
const Log = require('log');
const path = require('path');
const Builder = require('../../src/');

module.exports = (sampleFile) => {
  return {

    createMachine: () => {
      const builder = new Builder();
      builder.logger = new Log(process.env.SPEC_LOGLEVEL || 'error');
      builder.machine.readers.github.username = process.env.SPEC_GITHUB_USERNAME;
      builder.machine.readers.github.token = process.env.SPEC_GITHUB_PASSWORD || process.env.SPEC_GITHUB_TOKEN;
      builder.machine.readers.file.searchDirs.push(path.dirname(sampleFile));
      return builder.machine;
    },

    getResult: () => {
      return fs.readFileSync(sampleFile + '.out', 'utf-8');
    },

    getResultWithLineControl: () => {
      const content = fs.readFileSync(sampleFile + '.out-lc', 'utf-8');
      // replace for files, that have predefined line control
      // with char '$' instead of slash for compatibility with Unix and Windows
      // for example, line control "#line 1 1$2$test" will be
      // "#line 1 1/2/test" on Unix and "#line 1 1\2\test" on Windows
      return content.replace(/\$/g, path.sep);
    }
  };
};
