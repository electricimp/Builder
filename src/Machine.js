/**
 * Builder VM
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

const path = require('path');
const Expression = require('./Expression');
const AbstractReader = require('./Readers/AbstractReader');

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
  },
  'ExpressionEvaluationError': class ExpressionEvaluationError extends Error {
  },
  'SourceInclusionError': class SourceInclusionError extends Error {
  },
  'MaxIncludeDepthReachedError': class MaxIncludeDepthReachedError extends Error {
  }
};

// maximum nesting depth
const MAX_INCLUDE_DEPTH = 256;

class Machine {

  /**
   * Execute some code
   * @param {string} source
   * @param {{}={}} context
   */
  execute(source, context) {
    // reset state
    this._reset();

    // parse
    const ast = this.parser.parse(source);

    // execute
    context = this._mergeContexts({__FILE__: this.file}, this._globals, context);
    const buffer = [];
    this._execute(ast, context, buffer);

    // return output buffer contents
    return buffer.join('');
  }

  /**
   * Reset state
   * @private
   */
  _reset() {
    this._globals = {}; // global context
    this._macros = {}; // macros
    this._depth = 0; // nesting level
  }

  /**
   * Execute AST
   * @param {[]} ast
   * @param {{}} context
   * @param {string[]} buffer - output buffer
   * @private
   */
  _execute(ast, context, buffer) {

    for (const insruction of ast) {

      // current context
      context = this._mergeContexts(
        this._globals,
        context
      );

      // if called from inline directive (@{...}),
      // __LINE__ should not be updated
      if (!context.__INLINE__) {
        // set __LINE__
        context.__LINE__ = insruction._line;
      }

      try {

        switch (insruction.type) {

          case INSTRUCTIONS.INCLUDE:
            this._executeInclude(insruction, context, buffer);
            break;

          case INSTRUCTIONS.OUTPUT:
            this._executeOutput(insruction, context, buffer);
            break;

          case INSTRUCTIONS.SET:
            this._executeSet(insruction, context, buffer);
            break;

          case INSTRUCTIONS.CONDITIONAL:
            this._executeConditional(insruction, context, buffer);
            break;

          case INSTRUCTIONS.ERROR:
            this._executeError(insruction, context, buffer);
            break;

          case INSTRUCTIONS.MACRO:
            this._executeMacro(insruction, context, buffer);
            break;

          default:
            throw new Error(`Unsupported instruction "${insruction.type}"`);
        }

      } catch (e) {

        // add file/line information to errors
        if (e instanceof Expression.Errors.ExpressionError) {
          throw new Errors.ExpressionEvaluationError(`${e.message} (${context.__FILE__}:${context.__LINE__})`);
        } else if (e instanceof AbstractReader.Errors.SourceReadingError) {
          throw new Errors.SourceInclusionError(`${e.message} (${context.__FILE__}:${context.__LINE__})`);
        } else {
          throw e;
        }

      }
    }
  }

  /**
   * Execute "include" instruction
   * @param {{type, value}} instruction
   * @param {{}} context
   * @param {string[]} buffer
   * @private
   */
  _executeInclude(instruction, context, buffer) {

    if (this._depth === MAX_INCLUDE_DEPTH) {
      throw new Errors.MaxIncludeDepthReachedError(
        `Maximum inclusion depth reached, possible cyclic reference? (${context.__FILE__}:${context.__LINE__})`
      );
    }

    // increase nesting level
    this._depth++;

    const macro = this.expression.parseMacroCall(
      instruction.value, context, this._macros
    );

    if (macro) {
      // macro inclusion
      this._includeMacro(macro, context, buffer);
    } else {
      // source inclusion
      this._includeSource(instruction.value, context, buffer);
    }

    // increase nesting level
    this._depth--;
  }

  /**
   * Include source
   * @param {string} source
   * @param {{}} context
   * @param {string[]} buffer
   * @private
   */
  _includeSource(source, context, buffer) {

    // path is an expression, evaluate it
    const includePath = this.expression.evaluate(
      source, context
    );

    let reader;

    if (/^https?:/i.test(includePath)) {
      // http
      this.parser.file = path.basename(includePath); // provide filename for correct error messages
      reader = this.readers.http;
    } else if (/\.git\b/i.test(includePath)) {
      // git
      throw new Error('GIT sources are not supported at the moment');
    } else {
      // file
      this.parser.file = path.basename(includePath); // provide filename for correct error messages
      reader = this.readers.file;
    }

    // read
    this.logger.info(`Including local file "${includePath}"`);
    const content = reader.read(includePath);

    // parse
    const ast = this.parser.parse(content);

    // update context
    if (!context.__INLINE__) {
      // __FILE__
      context = this._mergeContexts(context, {
        __FILE__: path.basename(includePath)
      });
    }

    // execute included AST
    this._execute(ast, context, buffer);
  }

  /**
   * Include macro
   * @param {{name, args: []}} macro
   * @param {{}} context
   * @param {string[]} buffer
   * @private
   */
  _includeMacro(macro, context, buffer) {
    // context for macro
    const macroContext = {};

    // iterate through macro arguments
    // missing arguments will not be defined in macro context (ie will be evaluated as nulls)
    // extra arguments passed in macro call are omitted
    for (let i = 0; i < Math.min(this._macros[macro.name].args.length, macro.args.length); i++) {
      macroContext[this._macros[macro.name].args[i]] = macro.args[i];
    }

    // update context
    if (!context.__INLINE__) {
      // __FILE__ (file macro is defined in)
      macroContext.__FILE__ = this._macros[macro.name].file;
    }

    // execute macro
    this._execute(
      this._macros[macro.name].body,
      this._mergeContexts(context, macroContext),
      buffer
    );
  }

  /**
   * Execute "output" instruction
   * @param {{type, value, computed}} instruction
   * @param {{}} context
   * @param {string[]} buffer
   * @private
   */
  _executeOutput(instruction, context, buffer) {

    if (instruction.computed) {

      // pre-computed output
      this._out(
        String(instruction.value),
        context,
        buffer
      );

    } else {

      // detect if it's a macro
      const macro = this.expression.parseMacroCall(instruction.value, context, this._macros);

      if (macro) {

        // include macro in inline mode
        this._includeMacro(
          macro,
          this._mergeContexts(context, /* enable inline mode for all subsequent operations */ {__INLINE__: true}),
          buffer
        );

      } else {

        // evaluate & output
        this._out(
          String(this.expression.evaluate(instruction.value, context)),
          context,
          buffer
        );

      }

    }
  }

  /**
   * Execute "set" instruction
   * @param {{type, variable, value}} instruction
   * @param {{}} context
   * @param {string[]} buffer
   * @private
   */
  _executeSet(instruction, context, buffer) {
    this._globals[instruction.variable] =
      this.expression.evaluate(instruction.value, context);
  }

  /**
   * Execute "error: instruction
   * @param {{type, value}} instruction
   * @param {{}} context
   * @param {string[]} buffer
   * @private
   */
  _executeError(instruction, context, buffer) {
    throw new Errors.UserDefinedError(
      this.expression.evaluate(instruction.value, context)
    );
  }

  /**
   * Execute "conditional" instruction
   * @param {{type, test, consequent, alternate, elseifs}} instruction
   * @param {{}} context
   * @param {string[]} buffer
   * @private
   */
  _executeConditional(instruction, context, buffer) {
    const test = this.expression.evaluate(instruction.test, context);

    if (test) {

      this._execute(instruction.consequent, context, buffer);

    } else {

      // elseifs
      if (instruction.elseifs) {
        for (const elseif of instruction.elseifs) {
          if (this._executeConditional(elseif, context, buffer)) {
            // "@elseif true" stops if-elseif...-else flow
            return;
          }
        }
      }

      // else
      if (instruction.alternate) {
        this._execute(instruction.alternate, context, buffer);
      }

    }

    return test;
  }

  /**
   * Execute macro declaration instruction
   * @param {{type, declaration, body: []}} instruction
   * @param {{}} context
   * @param {string[]} buffer
   * @private
   */
  _executeMacro(instruction, context, buffer) {
    // parse declaration of a macro
    const macro = this.expression.parseMacroDeclaration(instruction.declaration);

    // do not allow macro redeclaration
    if (this._macros.hasOwnProperty(macro.name)) {
      throw new Errors.MacroIsAlreadyDeclared(
        `Macro "${macro.name}" is alredy declared in ` +
        `${this._macros[macro.name].file}:${this._macros[macro.name].line}` +
        ` (${context.__FILE__}:${context.__LINE__})`
      );
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
   * @param {*} output
   * @param {{}} context
   * @param {string[]} buffer
   * @private
   */
  _out(output, context, buffer) {

    // generate line control statement
    if (this.generateLineControlStatements && !context.__INLINE__) {
      if (buffer.lastOutputFile !== context.__FILE__ /* detect file switch */) {
        buffer.push(`#line ${context.__LINE__} "${context.__FILE__.replace(/\"/g, '\\\"')}"\n`);
        buffer.lastOutputFile = context.__FILE__;
      }
    }

    // append output
    buffer.push(output);
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
    return this._readers;
  }

  /**
   * @param {{http, git, file: FileReader}} value
   */
  set readers(value) {
    this._readers = value;
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
    if (this.readers.file) this.readers.file.logger = value;
    if (this.readers.http) this.readers.http.logger = value;
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
