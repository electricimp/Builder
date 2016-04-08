/**
 * Builder
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

const Machine = require('./Machine');
const AstParser = require('./AstParser');
const Expression = require('./Expression');
const LocalFileReader = require('./FileReader');

class Builder {

  constructor() {
    this._initMachine();
  }

  /**
   * Init machine
   * @private
   */
  _initMachine() {
    const fileReader = new LocalFileReader();
    fileReader.logger = this.logger;

    const expression = new Expression();
    const parser = new AstParser();

    const machine = new Machine();

    machine.readers = {
      'file': fileReader,
      'http': null,
      'git': null
    };

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
  }
}

module.exports = Builder;
