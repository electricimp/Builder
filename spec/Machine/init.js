// Copyright (c) 2016-2019 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

const fs = require('fs');
const Log = require('log');
const path = require('path');
const eol = require('eol');
const Builder = require('../../src/');

module.exports = (sampleFile) => {
  return {

    createMachine: () => {
      // File listing libs to include
      const libFile = `${path.dirname(sampleFile)}/libs`;
      let libs = [];
      if (fs.existsSync(libFile)) {
        libs = eol.lf(fs.readFileSync(libFile).toString()).split('\n').map(l => `${path.dirname(sampleFile)}/${l}`);
      }
      const builder = new Builder({ libs });
      builder.logger = new Log(process.env.SPEC_LOGLEVEL || 'error');
      builder.machine.suppressDupWarning = true;
      builder.machine.readers.github.username = process.env.SPEC_GITHUB_USERNAME;
      builder.machine.readers.github.token = process.env.SPEC_GITHUB_PASSWORD || process.env.SPEC_GITHUB_TOKEN;
      builder.machine.readers.file.runDir = path.dirname(sampleFile);
      return builder.machine;
    },

    getResult: () => {
      return eol.lf(fs.readFileSync(sampleFile + '.out', 'utf-8'));
    },

    getResultWithLineControl: () => {
      let content;
      try {
        content = eol.lf(fs.readFileSync(sampleFile + '.out-lc', 'utf-8'));
      } catch (err) {
        if (err.code == 'ENOENT') {
          const platform = /^win/.test(process.platform) ? '-win' : '-unix';
          content = eol.lf(fs.readFileSync(sampleFile + '.out-lc' + platform, 'utf-8'));
        } else {
          throw err;
        }
      }
      return content;
    }
  };
};
