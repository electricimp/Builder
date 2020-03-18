// MIT License
//
// Copyright 2016-2020 Electric Imp
//
// SPDX-License-Identifier: MIT
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
// EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
// OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

'use strict';

const url = require('url');
const path = require('path');
const upath = require('upath');
const fs = require('fs');
const md5 = require('md5');

const Expression = require('./Expression');
const AbstractReader = require('./Readers/AbstractReader');
const FileCache = require('./FileCache');
const merge = require('./merge');

// instruction types
const INSTRUCTIONS = {
  SET: 'set',
  LOOP: 'loop',
  ERROR: 'error',
  WARNING: 'warning',
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
  'MaxExecutionDepthReachedError': class MaxExecutionDepthReachedError extends Error {
  }
};

// maximum nesting depth
const MAX_EXECUTION_DEPTH = 256;

/**
 * Builder VM
 */
class Machine {

  constructor() {
    this.file = 'main'; // default source filename
    this.path = ''; // default source path
    this.readers = {};
    this.globals = {};
    this.fileCache = new FileCache(this);
    this._initBuiltinFunctions();
  }

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

    // read dependencies
    this._loadDependencies();

    // read directives, merge it with actual context
    context = this._loadAndMergeDirectives(context);

    // execute
    context = merge(
      {__FILE__: this.file, __PATH__: this.path},
      this._builtinFunctions,
      this.globals,
      context
    );

    const buffer = [];
    this._execute(ast, context, buffer);

    // save dependencies
    this._saveDependencies();

    // save directives
    this._saveDirectives();

    // return output buffer contents
    return buffer.join('');
  }

  clearCache() {
    this.fileCache.clearCache();
  }

  /**
   * Init built-in expression functions
   * @private
   */
  _initBuiltinFunctions() {
    this._builtinFunctions = {}; // builtin functions

    // include()
    const that = this;
    this._builtinFunctions['include'] = function() {
      const args = [].slice.call(arguments);
      if (args.length < 1) {
        throw Error('Wrong number of arguments for include()');
      }

      const buffer = [];

      // include macro in inline mode
      that._includeSource(
        args[0],
        /* enable inline mode for all subsequent operations */
        merge(this, {__INLINE__: true}),
        buffer,
        false,
        true
      );

      // trim trailing newline in inline mode
      that._trimLastLine(buffer);

      return buffer.join('');
    };
  }

  /**
   * Reset state
   * @private
   */
  _reset() {
    this._macros = {}; // macros
    this._depth = 0; // nesting level
    this._includedSources = new Set(); // all included sources
    this._includedSourcesHashes = new Map(); // all included sources content hash values
    this._globalContext = {}; // global context
  }

  /**
   * Format path
   * @private
   */
  _formatPath(filepath, filename) {
    return path.normalize(path.join(filepath, filename));
  }

  /**
   * Execute AST
   * @param {[]} ast
   * @param {{}} context
   * @param {string[]} buffer - output buffer
   * @private
   */
  _execute(ast, context, buffer) {

    if (this._depth === MAX_EXECUTION_DEPTH) {
      throw new Errors.MaxExecutionDepthReachedError(
        // Since anything greater than zero means a recurring call
        // from the entry base block, __LINE__ will be defined in context.
        // MAX_INCLUDE_DEPTH == 0 doesn't allow execution at all.
        `Maximum execution depth reached, possible cyclic reference? (${this._formatPath(context.__PATH__, context.__FILE__)}:${context.__LINE__})`
      );
    }

    this._depth++;

    for (const instruction of ast) {

      // set __LINE__
      context = merge(
        context,
        {__LINE__: instruction._line}
      );

      try {

        switch (instruction.type) {

          case INSTRUCTIONS.INCLUDE:
            this._executeInclude(instruction, context, buffer);
            break;

          case INSTRUCTIONS.OUTPUT:
            this._executeOutput(instruction, context, buffer);
            break;

          case INSTRUCTIONS.SET:
            this._executeSet(instruction, context, buffer);
            break;

          case INSTRUCTIONS.CONDITIONAL:
            this._executeConditional(instruction, context, buffer);
            break;

          case INSTRUCTIONS.ERROR:
            this._executeError(instruction, context, buffer);
            break;

          case INSTRUCTIONS.WARNING:
            this._executeWarning(instruction, context, buffer);
            break;

          case INSTRUCTIONS.MACRO:
            this._executeMacro(instruction, context, buffer);
            break;

          case INSTRUCTIONS.LOOP:
            this._executeLoop(instruction, context, buffer);
            break;

          default:
            throw new Error(`Unsupported instruction "${instruction.type}"`);
        }

      } catch (e) {

        // add file/line information to errors
        if (e instanceof Expression.Errors.ExpressionError) {
          throw new Errors.ExpressionEvaluationError(`${e.message} (${this._formatPath(context.__PATH__, context.__FILE__)}:${context.__LINE__})`);
        } else if (e instanceof AbstractReader.Errors.SourceReadingError) {
          throw new Errors.SourceInclusionError(`${e.message} (${this._formatPath(context.__PATH__, context.__FILE__)}:${context.__LINE__})`);
        } else {
          throw e;
        }

      }
    }

    this._depth--;
  }

  /**
   * Execute "include" instruction
   * @param {{type, value}} instruction
   * @param {{}} context
   * @param {string[]} buffer
   * @private
   */
  _executeInclude(instruction, context, buffer) {

    const macro = this.expression.parseMacroCall(
      instruction.value,
      context,
      this._macros
    );

    if (macro) {
      // macro inclusion
      this._includeMacro(macro, context, buffer);
    } else {
      // source inclusion
      this._includeSource(instruction.value, context, buffer, instruction.once);
    }
  }

  /**
   * Concatenate github URL prefix and local relative include
   * @param {string[]} prefix
   * @param {string[]} includePath
   * @private
   */
  _formatURL(prefix, includePath) {

    const URL = url.parse(prefix);
    if (!URL.protocol) {
      return undefined;
    }

    const res = prefix.match(/(github:)(.*)/);
    if (res === null) {
      return undefined;
    }

    const suffix = upath.normalize(upath.join(res[2], includePath));
    return `${res[1]}${suffix}`.replace(/\\/g, '/');
  }

  /**
   * Replace local includes to github URLs if requested
   * @param {string} includePath
   * @param {{}} context
   * @private
   */
  _remoteRelativeIncludes(includePath, context) {

    if (!this.remoteRelativeIncludes) {
      return includePath;
    }

    /*
     * The logic below could be moved to the _getReader()
     * function and implemented for every reader type independently.
     */

    // check if the file is included locally
    if (this._getReader(includePath) !== this.readers.file) {
      return includePath;
    }

    // check that path is not absolute
    if (path.isAbsolute(includePath)) {
      return includePath;
    }

    // check if file is included from github source
    const remotePath = this._formatURL(context.__PATH__, includePath);
    if (remotePath && this._getReader(remotePath) === this.readers.github) {
      return context.__REF__ ? `${remotePath}@${context.__REF__}` : remotePath;
    }

    return includePath;
  }

  /**
   * Include source
   * @param {string} source
   * @param {{}} context
   * @param {string[]} buffer
   * @param {boolean=false} once
   * @param {boolean=false} evaluated - is source ref already evaluated?
   * @private
   */
  _includeSource(source, context, buffer, once, evaluated) {

    // path is an expression, evaluate it
    let includePath = evaluated ? source : this.expression.evaluate(
      source,
      context,
    ).trim();

    // if once flag is set, then check if source has already been included
    if (once && this._includedSources.has(includePath)) {
      this.logger.debug(`Skipping source "${includePath}" - contents have already been included previously`);
      return;
    }

    // checkout local includes in the github sources from github
    includePath = this._remoteRelativeIncludes(includePath, context);

    const reader = this._getReader(includePath);
    this.logger.info(`Including source "${includePath}"`);

    // read
    const res = this.fileCache.read(reader, includePath, this.dependencies);

    const md5sum = md5(res.content);

    // if once flag is set, then check if source has already been included
    if (once && this._includedSourcesHashes.has(md5sum)) {
      this._includedSources.add(includePath)  // Prevent fetches in the future for the same path
      this.logger.debug(`Skipping source "${includePath}" - contents have already been included previously`);
      return;
    }

    // Check if source with same hash value has already been included
    if (!this.suppressDupWarning && this._includedSourcesHashes.has(md5sum)) {
      const path = this._includedSourcesHashes.get(md5sum).path;
      const file = this._includedSourcesHashes.get(md5sum).file;
      const line = this._includedSourcesHashes.get(md5sum).line;
      const dupPath = includePath;
      const dupFile = context.__FILE__;
      const dupLine = context.__LINE__;
      const message = `Warning: duplicated includes detected! The same exact file content is included from
    ${file}:${line} (${path})
    ${dupFile}:${dupLine} (${dupPath})`;

      console.error("\x1b[33m" + message + '\u001b[39m');
    }

    const info = {
      path: includePath,
      file: context.__FILE__,
      line: context.__LINE__,
    };

    this._includedSourcesHashes.set(md5sum, info);

    // provide filename for correct error messages
    this.parser.file = res.includePathParsed.__FILE__;

    // parse
    const ast = this.parser.parse(res.content);

    // update context

    // __FILE__/__PATH__
    context = merge(
      context,
      res.includePathParsed
    );

    // store included source
    this._includedSources.add(includePath);

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

    // __FILE__/__PATH__ (file macro is defined in)
    macroContext.__FILE__ = this._macros[macro.name].file;
    macroContext.__PATH__ = this._macros[macro.name].path;

    // execute macro
    this._execute(
      this._macros[macro.name].body,
      merge(context, macroContext),
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

      // evaluate & output
      this._out(
        String(this.expression.evaluate(
          instruction.value,
          context
        )),
        context,
        buffer
      );

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
    this._globalContext[instruction.variable] =
      this.expression.evaluate(
        instruction.value,
        context
      );
  }

  /**
   * Execute "error" instruction
   * @param {{type, value}} instruction
   * @param {{}} context
   * @param {string[]} buffer
   * @private
   */
  _executeError(instruction, context, buffer) {
    throw new Errors.UserDefinedError(
      this.expression.evaluate(instruction.value,
        context
      )
    );
  }

  /**
   * Execute "warning" instruction
   * @param {{type, value}} instruction
   * @param {{}} context
   * @param {string[]} buffer
   * @private
   */
  _executeWarning(instruction, context, buffer) {
    const message = this.expression.evaluate(instruction.value,
      context
    );
    console.error("\x1b[33m" + message + '\u001b[39m');
  }

  /**
   * Execute "conditional" instruction
   * @param {{type, test, consequent, alternate, elseifs}} instruction
   * @param {{}} context
   * @param {string[]} buffer
   * @private
   */
  _executeConditional(instruction, context, buffer) {

    const test = this.expression.evaluate(
      instruction.test,
      context
    );

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
        `Macro "${macro.name}" is already declared in ` +
        `${this._macros[macro.name].file}:${this._macros[macro.name].line}` +
        ` (${this._formatPath(context.__PATH__, context.__FILE__)}:${context.__LINE__})`
      );
    }

    // save macro
    this._macros[macro.name] = {
      file: context.__FILE__, // file at declaration
      path: context.__PATH__, // path at declaration
      line: context.__LINE__, // line of declaration
      args: macro.args,
      body: instruction.body
    };

    // add macro to supported function in expression expression
    const that = this;
    this._globalContext[macro.name] = (function(macro) {
      return function() {
        const args = [].slice.call(arguments);
        const buffer = [];
        macro.args = args;

        // include macro in inline mode
        that._includeMacro(
          macro,
          /* enable inline mode for all subsequent operations */
          merge(this, {__INLINE__: true}),
          buffer
        );

        // trim trailing newline (only in inline mode for macros)
        that._trimLastLine(buffer);

        return buffer.join('');
      };
    })(macro);
  }

  /**
   * Execute loop instruction
   * @param {{type, while, repeat, body: []}} instruction
   * @param {{}} context
   * @param {string[]} buffer
   * @private
   */
  _executeLoop(instruction, context, buffer) {

    let index = 0;

    while (true) {
      // evaluate test expression
      const test = this._expression.evaluate(
        instruction.while || instruction.repeat,
        context
      );

      // check break condition
      if (instruction.while && !test) {
        break;
      } else if (instruction.repeat && test === index) {
        break;
      }

      // execute body
      this._execute(
        instruction.body,
        merge(
          context,
          {loop: {index, iteration: index + 1}}
        ),
        buffer
      );

      // increment index
      index++;
    }

  }

  /**
   * Perform output operation
   * @param {string|string[]} output
   * @param {{}} context
   * @param {string[]} buffer
   * @private
   */
  _out(output, context, buffer) {
    // generate line control statement
    if (this.generateLineControlStatements && !context.__INLINE__) {
      if (buffer.lastOutputFile !== context.__FILE__ /* detect file switch */) {
        let parsedURL = url.parse(context.__PATH__);
        let source = parsedURL.protocol ?
          `${context.__PATH__}/${context.__FILE__}` :
          path.join(context.__PATH__, context.__FILE__);
        buffer.push(`#line ${context.__LINE__} "${source.replace(/"/g, '\\\"')}"\n`);
        buffer.lastOutputFile = context.__FILE__;
      }
    }

    // append output to buffer
    if (Array.isArray(output)) {
      for (const chunk of output) {
        buffer.push(chunk);
      }
    } else {
      buffer.push(output);
    }
  }

  /**
   * Find reader
   *
   * @param {*} source
   * @return {AbstractReader}
   * @private
   */
  _getReader(source) {
    for (const type in this.readers) {
      const reader = this.readers[type];
      if (reader.supports(source)) {
        return reader;
      }
    }

    throw new Error(`Source "${source}" is not supported`);
  }


  /**
   * Trim last buffer line
   * @param {string[]} buffer
   * @private
   */
  _trimLastLine(buffer) {
    // trim trailing newline in inline mode
    if (buffer.length > 0) {
      buffer[buffer.length - 1] =
        buffer[buffer.length - 1]
          .replace(/(\r\n|\n)$/, '');
    }
  }

  /**
   * Read dependencies JSON file content
   * @param
   * @return
   * @private
   */
  _loadDependencies() {
    if (!this.dependenciesUseFile) {
      if (this.dependenciesSaveFile) {
        this.dependencies = new Map();
      }

      return;
    }

    if (!fs.existsSync(this.dependenciesUseFile)) {
      throw new Error(`The dependencies JSON file '${this.dependenciesUseFile}' does not exist`)
    }

    try {
      this.dependencies = new Map(JSON.parse(fs.readFileSync(this.dependenciesUseFile, 'utf8')));
    } catch(err) {
      throw new Error(`The dependencies JSON file '${this.dependenciesUseFile}' cannot be used: ${err.message}`);
    }
  }

  /**
   * Read directives JSON file content and merge it with actual context
   * @param {*} context
   * @return {*}
   * @private
   */
  _loadAndMergeDirectives(context) {
    if (!this.directivesUseFile) {
      if (this.directivesSaveFile) {
        this.directives = Object.assign({}, context);
      }

      return context;
    }

    if (!fs.existsSync(this.directivesUseFile)) {
      throw new Error(`The directives JSON file '${this.directivesUseFile}' does not exist`);
    }

    try {
      this.directives = merge(JSON.parse(fs.readFileSync(this.directivesUseFile).toString()), context);
    } catch(err) {
      throw new Error(`The directives JSON file '${this.directivesUseFile}' cannot be used: ${err.message}`);
    }

    return Object.assign({}, this.directives);
  }

  /**
   * Save dependencies JSON file
   * @param
   * @return
   * @private
   */
  _saveDependencies() {
    if (!this.dependenciesSaveFile) {
      return;
    }

    try {
      fs.writeFileSync(this.dependenciesSaveFile, JSON.stringify([...this.dependencies], null, 2), 'utf-8');
    } catch (err) {
      throw new Error(`The ${this.dependenciesSaveFile} file cannot be saved: ${err.message}`);
    }
  }

  /**
   * Save defined variables to directives JSON file
   * @param
   * @return
   * @private
   */
  _saveDirectives() {
    if (!this.directivesSaveFile || !this.directives) {
      return;
    }

    try {
      fs.writeFileSync(this.directivesSaveFile, JSON.stringify(this.directives, null, 2));
    } catch(err) {
      throw new Error(`The ${this.directivesSaveFile} file cannot be saved: ${err.message}`);
    }
  }

  // <editor-fold desc="Accessors" defaultstate="collapsed">

  /**
   * @return {*} value
   */
  get readers() {
    return this._readers;
  }

  /**
   * @param {*} value
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

    for (const readerType in this.readers) {
      this.readers[readerType].logger = value;
    }
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
   * Use cache?
   * @return {boolean}
   */
  get useCache() {
    return this.fileCache.useCache;
  }

  /**
   * @param {boolean} value
   */
  set useCache(value) {
    this.fileCache.useCache = value;
  }

  /**
   * Filename
   * @return {string}
   */
  get file() {
    return this._file;
  }

  /**
   * @param {string} value
   */
  set file(value) {
    this._file = value;
  }

  get path() {
    return this._path;
  }

  set path(value) {
    this._path = value;
  }

  get globals() {
    return this._globals;
  }

  set globals(value) {
    this._globals = value;
  }

  get excludeList() {
    return this.fileCache.excludeList;
  }

  /**
   * Construct exclude regexp list from filename
   * @param {string} name of exclude file. '' for default
   */
  set excludeList(fileName) {
    this.fileCache.excludeList = fileName;
  }
  // </editor-fold>
}

module.exports = Machine;
module.exports.INSTRUCTIONS = INSTRUCTIONS;
module.exports.Errors = Errors;
