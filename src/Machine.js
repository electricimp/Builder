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

const Errors = {
  'UserDefinedError': class UserDefinedError extends Error {
  }
};

class Machine {

  /**
   * Execute some code
   * @param {string} source
   * @param {{__FILE__}} context - defined variables
   */
  execute(source, context) {
    // reset state
    this._output = '';
    this._context = Object.assign(context || {}, {__FILE__: 'main'});

    // parse & execute code
    const ast = this.parser.parse(source);
    this._execute(ast, context);

    return this._output;
  }

  /**
   * Execute AST
   * @param {[]} ast
   * @param {{__FILE__}} context - defined variables
   * @private
   */
  _execute(ast) {
    for (const insruction of ast) {

      // set __LINE__ variable
      this._context.__LINE__ = insruction._line;

      switch (insruction.type) {

        case INSTRUCTIONS.INCLUDE:
          this._executeInclude(insruction);
          break;

        case INSTRUCTIONS.OUTPUT:
          this._executeOutput(insruction);
          break;

        case INSTRUCTIONS.SET:
          this._executeSet(insruction);
          break;

        case INSTRUCTIONS.CONDITIONAL:
          this._executeConditional(insruction);
          break;

        case INSTRUCTIONS.ERROR:
          this._executeError(insruction);
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
    const includePath = this.expression.evaluate(instruction.value, this._context);

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
    const parentFile = this._context.__FILE__;
    this._context.__FILE__ = path.basename(includePath);
    this._execute(ast);

    // restore __FILE__ variable
    this._context.__FILE__ = parentFile;
  }

  /**
   * Execute "output" instruction
   * @param {{type, value, computed}} instruction
   * @private
   */
  _executeOutput(instruction) {
    const output = instruction.computed
      ? instruction.value
      : this.expression.evaluate(instruction.value, this._context);
    this._output += output;
  }

  /**
   * Execute "set" instruction
   * @param {{type, variable, value}} instruction
   * @private
   */
  _executeSet(instruction) {
    this._context[instruction.variable] =
      this.expression.evaluate(instruction.value, this._context);
  }

  /**
   * @param {{type, value}} instruction
   * @private
   */
  _executeError(instruction) {
    throw new Errors.UserDefinedError(
      this.expression.evaluate(instruction.value, this._context)
    );
  }

  /**
   * Execute "conditional" instruction
   * @param {{type, test, consequent, alternate, elseifs}} instruction
   * @private
   */
  _executeConditional(instruction) {
    const test = this.expression.evaluate(instruction.test, this._context);

    if (test) {

      this._execute(instruction.consequent);

    } else {

      // elseifs
      if (instruction.elseifs) {
        for (const elseif of instruction.elseifs) {
          if (this._executeConditional(elseif)) {
            // "@elseif true" stops if-elseif...-else flow
            return;
          }
        }
      }

      // else
      if (instruction.alternate) {
        this._execute(instruction.alternate);
      }

    }

    return test;
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
module.exports.Errors = Errors;
