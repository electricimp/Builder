/**
 * Builder VM
 *
 * Events:
 *  - log {level, message}
 *
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

const path = require('path');

// instruction types
const INSTRUCTIONS = {
  SET: 'set',
  ERROR: 'error',
  OUTPUT: 'output',
  INCLUDE: 'include',
  CONDITIONAL: 'conditional'
};

class Machine {

  constructor() {
  }

  /**
   * Execute some code
   * @param {string} source
   */
  execute(source) {
    this._variables = {};
    this._output = '';
    this._execute(this.parser.parse(source));
    return this._output;
  }

  /**
   * Execute AST
   * @param {[]} ast
   * @private
   */
  _execute(ast) {
    for (const insruction of ast) {

      switch (insruction.type) {

        case INSTRUCTIONS.INCLUDE:
          this._executeInclude(insruction);
          break;

        case INSTRUCTIONS.OUTPUT:
          this._executeOutput(insruction);
          break;

        default:
          throw new Error(`Unsupported instruction "${insruction.type}"`);
      }

    }
  }

  /**
   * Execute "include" instruction
   * @param {{type, value}} instruction
   * @private
   */
  _executeInclude(instruction) {

    // path is an expression, evaluate it
    const includePath = this.expression.evaluate(instruction.value);

    let reader;

    if (/^https?:/i.test(includePath)) {
      // http
      throw new Error('HTTP sources are not supported at the moment');
    } else if (/\.git\b/i.test(includePath)) {
      // git
      throw new Error('GIT sources are not supported at the moment');
    } else {
      // file
      reader = this.readers['file'];
    }

    // read
    this.logger.info(`Including local file "${includePath}"`);
    const source = reader.read(includePath);

    // parse
    this.parser.file = path.basename(includePath);

    // execute included AST
    this._execute(this.parser.parse(source));
  }

  /**
   * Execute "output" instruction
   * @param {{}} instruction
   * @private
   */
  _executeOutput(instruction) {
    const output = instruction.computed
      ? instruction.value
      : this.expression.evaluate(instruction.value);
    this._output += output;
  }

  // <editor-fold desc="Accessors" defaultstate="collapsed">

  /**
   * @return {{http, git, file: FileReader}}
   */
  get readers() {
    return this._localFileReader;
  }

  /**
   * @param {{http, git, file: FileReader}} value
   */
  set readers(value) {
    this._localFileReader = value;
  }

  /**
   * @return {Expression}
   */
  get expression() {
    return this._expression;
  }

  /**
   * @param {Expression} value
   */
  set expression(value) {
    this._expression = value;
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

  /**
   * @return {AstParser}
   */
  get parser() {
    return this._astParser;
  }

  /**
   * @param {AstParser} value
   */
  set parser(value) {
    this._astParser = value;
  }

// </editor-fold>
}

module.exports = Machine;
module.exports.INSTRUCTIONS = INSTRUCTIONS;
