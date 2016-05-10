/**
 * Builder
 * @author Mikhail Yurasov <mikhail@electricimp.com>
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
    this._initGlobalContext();
    this._initMachine();
  }

  /**
   * Init global context
   * @private
   */
  _initGlobalContext() {
    // global context
    this._globalContext = {};

    // filters

    const escapeFilter = new EscapeFilter();
    this._globalContext[escapeFilter.name] = (args) => {
      return escapeFilter.filter(args.shift(), args);
    };

    const base64Filter = new Base64Filter();
    this._globalContext[base64Filter.name] = (args) => {
      return base64Filter.filter(args.shift(), args);
    };

    // arithmetic functions

    // create Math.* function
    const mathFunction = (name) => {
      return (args, context) => {
        if (args.length < 1) {
          throw new Error('Wrong number of arguments for ' + name + '()');
        }
        return Math[name].apply(Math, args);
      };
    };

    this._globalContext['abs'] = mathFunction('abs');
    this._globalContext['min'] = mathFunction('min');
    this._globalContext['max'] = mathFunction('max');
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

    machine.readers.github = githubReader;
    machine.readers.http = httpReader;
    machine.readers.file = fileReader;

    machine.globals = this._globalContext;

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
