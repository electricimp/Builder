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

  /**
   * Execute some code
   * @param {string} source
   * @param {string="main"} file name
   */
  execute(source, file) {
    // reset state
    this._output = '';
    this.context = {};

    // parse & execute code
    const ast = this.parser.parse(source);
    this._execute(ast, file);

    return this._output;
  }

  /**
   * Execute AST
   * @param {[]} ast
   * @param {string} file
   * @private
   */
  _execute(ast, file) {
    // set __FILE__ variable
    this.context.__FILE__ = file;

    for (const insruction of ast) {

      // set __LINE__ variable
      this.context.__LINE__ = insruction._line;

      switch (insruction.type) {

        case INSTRUCTIONS.INCLUDE:

          this._executeInclude(insruction);

          // restore __FILE__ variable
          this.context.__FILE__ = file;

          break;

        case INSTRUCTIONS.OUTPUT:
          this._executeOutput(insruction);
          break;

        case INSTRUCTIONS.SET:
          this._executeSet(insruction);
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
    const includePath = this.expression.evaluate(instruction.value, this.context);

    let reader;

    if (/^https?:/i.test(includePath)) {
      // http
      throw new Error('HTTP sources are not supported at the moment');
    } else if (/\.git\b/i.test(includePath)) {
      // git
      throw new Error('GIT sources are not supported at the moment');
    } else {
      // file
      reader = this.readers.file;
    }

    // read
    this.logger.info(`Including local file "${includePath}"`);
    const source = reader.read(includePath);

    // parse
    const ast = this.parser.parse(source);

    // execute included AST
    const file = path.basename(includePath);
    this._execute(ast, file);
  }

  /**
   * Execute "output" instruction
   * @param {{type, value, computed}} instruction
   * @private
   */
  _executeOutput(instruction) {
    const output = instruction.computed
      ? instruction.value
      : this.expression.evaluate(instruction.value, this.context);
    this._output += output;
  }

  /**
   * Eexecute "set" instruction
   * @param {{type, variable, value}} instruction
   * @private
   */
  _executeSet(instruction) {
    this.context[instruction.variable] =
      this.expression.evaluate(instruction.value, this.context);
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

  /**
   * Variables
   * @return {{}}
   */
  get context() {
    return this._context || {};
  }

  /**
   * @param {{}} value
   */
  set context(value) {
    this._context = value;
  }

// </editor-fold>
}

module.exports = Machine;
module.exports.INSTRUCTIONS = INSTRUCTIONS;
