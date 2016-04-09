/**
 * Builder VM
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

const path = require('path');
const Expression = require('./Expression');

// instruction types
const INSTRUCTIONS = {
  SET: 'set',
  ERROR: 'error',
  MACRO: 'macro',
  OUTPUT: 'output',
  INCLUDE: 'include',
  CONDITIONAL: 'conditional',
};

// custom errors
const Errors = {
  'UserDefinedError': class UserDefinedError extends Error {
  }
};

class Machine {

  /**
   * Execute some code
   * @param {string} source
   * @param {{}} context - global context
   */
  execute(source, context) {
    // reset state
    this._reset(context);

    // parse & execute code
    const ast = this.parser.parse(source);
    this._execute(ast, context);

    return this._output;
  }

  /**
   * Reset state
   * @param {{}} context
   * @private
   */
  _reset(context) {
    this._output = ''; // output buffer

    // global context
    this._globals = Object.assign({
      __FILE__: this.file
    }, context);

    this._macroses = {}; // macroses

    // file which produced the last output
    this._lastOutputFile = null;
  }

  /**
   * Execute AST
   * @param {[]} ast
   * @param {{}} context - variables
   * @private
   */
  _execute(ast, context) {
    for (const insruction of ast) {

      // set __LINE__ variable
      this._globals.__LINE__ = insruction._line;

      switch (insruction.type) {

        case INSTRUCTIONS.INCLUDE:
          this._executeInclude(insruction, context);
          break;

        case INSTRUCTIONS.OUTPUT:
          this._executeOutput(insruction, context);
          break;

        case INSTRUCTIONS.SET:
          this._executeSet(insruction, context);
          break;

        case INSTRUCTIONS.CONDITIONAL:
          this._executeConditional(insruction, context);
          break;

        case INSTRUCTIONS.ERROR:
          this._executeError(insruction, context);
          break;

        case INSTRUCTIONS.MACRO:
          this._executeMacro(insruction, context);
          break;

        default:
          throw new Error(`Unsupported instruction "${insruction.type}"`);
      }

    }
  }

  /**
   * Execute "include" instruction
   * @param {{type, value}} instruction
   * @param {{}} context - local variables
   * @private
   */
  _executeInclude(instruction, context) {
    try {
      const macro = this.expression.parseMacroCall(
        instruction.value, this._globals, this._macroses
      );

      // macro inclusion
      this._includeMacro(macro);

    } catch (e) {
      // retrow non-expected errors
      if (!(e instanceof Expression.Errors.NotMacroError)) {
        throw e;
      }

      // source inclusion
      this._includeSource(instruction.value);
    }
  }

  /**
   * Include source
   * @param {string} source
   * @param {{}} context - local variables
   * @private
   */
  _includeSource(source, context) {
    // path is an expression, evaluate it
    const includePath = this.expression.evaluate(source, this._globals);

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
    const content = reader.read(includePath);

    // parse
    const ast = this.parser.parse(content);

    // execute included AST
    const parentFile = this._globals.__FILE__;
    this._globals.__FILE__ = path.basename(includePath);
    this._execute(ast);

    // restore __FILE__ variable
    this._globals.__FILE__ = parentFile;
  }

  /**
   * Include macro
   * @param {{name, args: []}} macro
   * @param {{}} context - local variables
   * @private
   */
  _includeMacro(macro, context) {
    const parentFile = this._globals.__FILE__;
    this._globals.__FILE__ = this._macroses[macro.name].file;

    // set macro arguments

    const argNames = this._macroses[macro.name].args;
    const argValues = macro.args;

    for (let i = 0; i < Math.min(argNames.length, argValues.length); i++) {
      this._globals[argNames[i]] = argValues[i];
    }

    //

    this._execute(this._macroses[macro.name].body);
    this._globals.__FILE__ = parentFile;
  }

  /**
   * Execute "output" instruction
   * @param {{type, value, computed}} instruction
   * @param {{}} context - local variables
   * @private
   */
  _executeOutput(instruction, context) {
    const output = instruction.computed
      ? instruction.value
      : this.expression.evaluate(instruction.value, this._globals);
    this._out(output);
  }

  /**
   * Execute "set" instruction
   * @param {{type, variable, value}} instruction
   * @param {{}} context - local variables
   * @private
   */
  _executeSet(instruction, context) {
    this._globals[instruction.variable] =
      this.expression.evaluate(instruction.value, this._globals);
  }

  /**
   * @param {{type, value}} instruction
   * @private
   */
  _executeError(instruction) {
    throw new Errors.UserDefinedError(
      this.expression.evaluate(instruction.value, this._globals)
    );
  }

  /**
   * Execute "conditional" instruction
   * @param {{type, test, consequent, alternate, elseifs}} instruction
   * @param {{}} context - local variables
   * @private
   */
  _executeConditional(instruction, context) {
    const test = this.expression.evaluate(instruction.test, this._globals);

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

  /**
   * Execute macro instruction
   * @param {{type, declaration, body: []}} instruction
   * @param {{}} context - local variables
   * @private
   */
  _executeMacro(instruction, context) {
    // parse declaration of a macro
    const macro = this.expression.parseMacroDeclaration(instruction.declaration);

    // save macro
    this._macroses[macro.name] = {
      file: this._globals.__FILE__,
      args: macro.args,
      body: instruction.body
    };
  }

  /**
   * Perform outoput operation
   * @param {string} output
   * @private
   */
  _out(output) {
    // generate line control statement
    if (this.generateLineControlStatements) {
      if (this._lastOutputFile !== this._globals.__FILE__ /* detect file switch */) {
        this._output +=
          `#line ${this._globals.__LINE__} "${this._globals.__FILE__.replace(/\"/g, '\\\"')}"\n`;
        this._lastOutputFile = this._globals.__FILE__;
      }
    }

    // append output
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

  /**
   * Generate line control statements?
   * @see https://gcc.gnu.org/onlinedocs/cpp/Line-Control.html
   * @return {boolean}
   */
  get generateLineControlStatements() {
    return this._generateLineControlStatements || false;
  }

  /**
   * @param {boolean} value
   */
  set generateLineControlStatements(value) {
    this._generateLineControlStatements = value;
  }

  /**
   * @return {MacroExpression}
   */
  get macroExpression() {
    return this._macroExpression;
  }

  /**
   * @param {MacroExpression} value
   */
  set macroExpression(value) {
    this._macroExpression = value;
  }

  /**
   * Filename
   * @return {string}
   */
  get file() {
    return this._file || 'main';
  }

  /**
   * @param {string} value
   */
  set file(value) {
    this._file = value;
  }

// </editor-fold>
}

module.exports = Machine;
module.exports.INSTRUCTIONS = INSTRUCTIONS;
module.exports.Errors = Errors;
