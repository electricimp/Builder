/**
 * Builder
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

const Machine = require('./Machine');
const AstParser = require('./AstParser');
const Expression = require('./Expression');
const FileReader = require('./Readers/FileReader');
const HttpReader = require('./Readers/HttpReader');
const GithubReader = require('./Readers/GithubReader');
const EscapeFilter = require('./Filters/EscapeFilter');
const Base64Filter = require('./Filters/Base64Filter');

class Builder {

  constructor() {
    this._initMachine();
  }

  /**
   * Init machine
   * @private
   */
  _initMachine() {
    const fileReader = new FileReader();
    const httpReader = new HttpReader();
    const githubReader = new GithubReader();

    const expression = new Expression();
    const parser = new AstParser();
    const machine = new Machine();

    // filters

    const escapeFilter = new EscapeFilter();
    expression.functions[escapeFilter.name] = (args) => {
      return escapeFilter.filter(args.shift(), args);
    };

    const base64Filter = new Base64Filter();
    expression.functions[base64Filter.name] = (args) => {
      return base64Filter.filter(args.shift(), args);
    };

    //

    machine.readers.github = githubReader;
    machine.readers.http = httpReader;
    machine.readers.file = fileReader;

    machine.expression = expression;
    machine.parser = parser;
    machine.logger = this.logger;
    machine.generateLineControlStatements = false;

    this._machine = machine;
  }

  /**
   * @return {Machine}
   */
  get machine() {
    return this._machine;
  }

  /**
   * @return {{debug(), info(), warning(), error()}}
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
   * @param {{debug(), info(), warning(), error()}} value
   */
  set logger(value) {
    this._logger = value;
    // update loggers
    this.machine.logger = value;
  }
}

module.exports = Builder;
