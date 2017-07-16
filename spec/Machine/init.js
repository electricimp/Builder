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
      let content;
      try {
        content = fs.readFileSync(sampleFile + '.out-lc', 'utf-8');
      } catch (err) {
        if (err.code == 'ENOENT') {
          let platform;
          switch (path.sep) {
            case '/':
              platform = '-unix';
              break;
            case '\\':
              platform = '-win';
              break;
            default:
              throw Error('Unknown platform');
          }
          content = fs.readFileSync(sampleFile + platform + '.out-lc', 'utf-8');
        } else {
          throw err;
        }
      }
      return content;
    }
  };
};
