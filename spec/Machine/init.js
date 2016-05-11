/**
 * Init Machine
 * @author Mikhail Yurasov <me@yurasov.me>
 */

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
      return fs.readFileSync(sampleFile + '.out-lc', 'utf-8');
    }
  };
};
