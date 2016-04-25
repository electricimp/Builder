/**
 * Init Machine
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

const fs = require('fs');
const Log = require('log');
const path = require('path');
const Machine = require('../../src/Machine');
const AstParser = require('../../src/AstParser');
const Expression = require('../../src/Expression');
const HttpReader = require('../../src/Readers/HttpReader');
const FileReader = require('../../src/Readers/FileReader');
const GithubReader = require('../../src/Readers/GithubReader');

module.exports = (sampleFile) => {
  return {

    createMachine: () => {
      // @see https://www.npmjs.com/package/log#log-levels
      const logger = new Log(process.env.SPEC_LOGLEVEL || 'error');

      const fileReader = new FileReader();
      fileReader.logger = logger;
      fileReader.searchDirs.push(path.dirname(sampleFile));

      const httpReader = new HttpReader();
      httpReader.logger = logger;

      const githubReader = new GithubReader();
      githubReader.logger = logger;

      const expression = new Expression();
      const parser = new AstParser();

      const machine = new Machine();

      machine.readers.github = githubReader;
      machine.readers.http = httpReader;
      machine.readers.file = fileReader;

      machine.expression = expression;
      machine.parser = parser;
      machine.logger = logger;
      machine.generateLineControlStatements = false;

      return machine;
    },

    getResult: () => {
      return fs.readFileSync(sampleFile + '.out', 'utf-8');
    },

    getResultWithLineControl: () => {
      return fs.readFileSync(sampleFile + '.out-lc', 'utf-8');
    }
  };
};
