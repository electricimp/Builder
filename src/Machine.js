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
  },
  'MacroIsAlreadyDeclared': class MacroIsAlreadyDeclared extends Error {
  }
};

class Machine {

  /**
   * Execute some code
   * @param {string} source
   * @param {{}={}} context
   */
  execute(source, context) {
    // reset state
    this._reset();

    // parse & execute code
    const ast = this.parser.parse(source);
    this._execute(ast, this._mergeContexts({__FILE__: this.file}, this._globals, context));

    return this._output;
  }

  /**
   * Reset state
   * @private
   */
  _reset() {
    this._output = ''; // output buffer
    this._globals = {}; // global context
    this._macros = {}; // macros

    // file which produced the last output
    this._lastOutputFile = null;
  }

  /**
   * Execute AST
   * @param {[]} ast
   * @param {{}} context
   * @private
   */
  _execute(ast, context) {
    for (const insruction of ast) {

      // current context
      const c = this._mergeContexts(
        this._globals,
        context
      );

      // set __LINE__
      c.__LINE__ = insruction._line;

      switch (insruction.type) {

        case INSTRUCTIONS.INCLUDE:
          this._executeInclude(insruction, c);
          break;

        case INSTRUCTIONS.OUTPUT:
          this._executeOutput(insruction, c);
          break;

        case INSTRUCTIONS.SET:
          this._executeSet(insruction, c);
          break;

        case INSTRUCTIONS.CONDITIONAL:
          this._executeConditional(insruction, c);
          break;

        case INSTRUCTIONS.ERROR:
          this._executeError(insruction, c);
          break;

        case INSTRUCTIONS.MACRO:
          this._executeMacro(insruction, c);
          break;

        default:
          throw new Error(`Unsupported instruction "${insruction.type}"`);
      }

    }
  }

  /**
   * Execute "include" instruction
   * @param {{type, value}} instruction
   * @param {{}} context
   * @private
   */
  _executeInclude(instruction, context) {
    try {
      const macro = this.expression.parseMacroCall(
        instruction.value, context, this._macros
      );

      // macro inclusion
      this._includeMacro(macro, context);

    } catch (e) {
      // retrow non-expected errors
      if (!(e instanceof Expression.Errors.NotMacroError)) {
        throw e;
      }

      // source inclusion
      this._includeSource(instruction.value, context);
    }
  }

  /**
   * Include source
   * @param {string} source
   * @param {{}} context
   * @private
   */
  _includeSource(source, context) {

    // path is an expression, evaluate it
    const includePath = this.expression.evaluate(
      source, context
    );

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
    this._execute(ast, this._mergeContexts(context, {
      __FILE__: path.basename(includePath)
    }));
  }

  /**
   * Include macro
   * @param {{name, args: []}} macro
   * @param {{}} context
   * @private
   */
  _includeMacro(macro, context) {
    // context for macro
    const macroContext = {};

    // iterate through macro arguments
    // missing arguments will not be defined in macro context (ie will be evaluated as nulls)
    // extra arguments passed in macro call are omitted
    for (let i = 0; i < Math.min(this._macros[macro.name].args.length, macro.args.length); i++) {
      macroContext[this._macros[macro.name].args[i]] = macro.args[i];
    }

    // file macro was defined in
    macroContext.__FILE__ = this._macros[macro.name].file;

    // execute it
    this._execute(this._macros[macro.name].body, this._mergeContexts(context, macroContext));
  }

  /**
   * Execute "output" instruction
   * @param {{type, value, computed}} instruction
   * @param {{}} context
   * @private
   */
  _executeOutput(instruction, context) {
    const output = instruction.computed
      ? instruction.value
      : this.expression.evaluate(instruction.value, context);
    this._out(output, context);
  }

  /**
   * Execute "set" instruction
   * @param {{type, variable, value}} instruction
   * @param {{}} context
   * @private
   */
  _executeSet(instruction, context) {
    this._globals[instruction.variable] =
      this.expression.evaluate(instruction.value, context);
  }

  /**
   * Execute "error: instruction
   * @param {{type, value}} instruction
   * @param {{}} context
   * @private
   */
  _executeError(instruction, context) {
    throw new Errors.UserDefinedError(
      this.expression.evaluate(instruction.value, context)
    );
  }

  /**
   * Execute "conditional" instruction
   * @param {{type, test, consequent, alternate, elseifs}} instruction
   * @param {{}} context
   * @private
   */
  _executeConditional(instruction, context) {
    const test = this.expression.evaluate(instruction.test, context);

    if (test) {

      this._execute(instruction.consequent, context);

    } else {

      // elseifs
      if (instruction.elseifs) {
        for (const elseif of instruction.elseifs) {
          if (this._executeConditional(elseif, context)) {
            // "@elseif true" stops if-elseif...-else flow
            return;
          }
        }
      }

      // else
      if (instruction.alternate) {
        this._execute(instruction.alternate, context);
      }

    }

    return test;
  }

  /**
   * Execute macro declaration instruction
   * @param {{type, declaration, body: []}} instruction
   * @param {{}} context
   * @private
   */
  _executeMacro(instruction, context) {
    // parse declaration of a macro
    const macro = this.expression.parseMacroDeclaration(instruction.declaration);

    // do not allow macro redeclaration
    if (this._macros.hasOwnProperty(macro.name)) {
      throw new Errors.MacroIsAlreadyDeclared(`Macro "${macro.name}" is alredy declared in ` +
                                              `${this._macros[macro.name].file}:${this._macros[macro.name].line}` +
                                              ` (${context.__FILE__}:${context.__LINE__})`);
    }

    // save macro
    this._macros[macro.name] = {
      file: context.__FILE__, // file of declaration
      line: context.__LINE__, // line of eclaration
      args: macro.args,
      body: instruction.body
    };
  }

  /**
   * Perform outoput operation
   * @param {string} output
   * @param {{}} context
   * @private
   */
  _out(output, context) {
    // generate line control statement
    if (this.generateLineControlStatements) {
      if (this._lastOutputFile !== context.__FILE__ /* detect file switch */) {
        this._output +=
          `#line ${context.__LINE__} "${context.__FILE__.replace(/\"/g, '\\\"')}"\n`;
        this._lastOutputFile = context.__FILE__;
      }
    }

    // append output
    this._output += output;
  }

  /**
   * Merge local context with global
   * @param {{}} ... - contexts
   * @private
   */
  _mergeContexts() {
    const args = Array.prototype.slice.call(arguments);

    // clone target
    let target = args.shift();
    target = JSON.parse(JSON.stringify(target));
    args.unshift(target);

    return Object.assign.apply(this, args);
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
