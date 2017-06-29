// Copyright (c) 2016-2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

const url = require('url');
const path = require('path');
const clone = require('clone');
const minimatch = require('minimatch');
const Expression = require('./Expression');
const fs = require('fs');
const AbstractReader = require('./Readers/AbstractReader');
const HttpReader = require('./Readers/HttpReader');
const GithubReader = require('./Readers/GithubReader');

// instruction types
const INSTRUCTIONS = {
  SET: 'set',
  LOOP: 'loop',
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
  'MaxExecutionDepthReachedError': class MaxExecutionDepthReachedError extends Error {
  }
};

// maximum nesting depth
const MAX_EXECUTION_DEPTH = 256;

// cache params
const DEFAULT_EXCLUDE_FILE_NAME = 'builder-cache.exclude';
const CACHED_READERS = [GithubReader, HttpReader];

const GITHUB_DIR = '/github';
const HTTP_DIR = '/http';

/**
 * Builder VM
 */
class Machine {

  constructor() {
    this.file = 'main'; // default source filename
    this.path = ''; // default source path
    this.readers = {};
    this.globals = {};
    this._useCache = false;
    this.cacheDir = './cache';
    this._excludeList = [];
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

    // execute
    context = this._mergeContexts(
      {__FILE__: this.file, __PATH__: this.path},
      this._builtinFunctions,
      this.globals,
      context
    );

    const buffer = [];
    this._execute(ast, context, buffer);

    // return output buffer contents
    return buffer.join('');
  }

  /**
   * Init built-in expression functions
   * @private
   */
  _initBuiltinFunctions() {
    this._builtinFunctions = {}; // builtin functions

    // include()
    this._builtinFunctions['include'] = (args, context) => {
      if (args.length < 1) {
        throw Error('Wrong number of arguments for include()');
      }

      const buffer = [];

      // include macro in inline mode
      this._includeSource(
        args[0],
        /* enable inline mode for all subsequent operations */
        this._mergeContexts(context, {__INLINE__: true}),
        buffer,
        false,
        true
      );

      // trim trailing newline in inline mode
      this._trimLastLine(buffer);

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
    this._globalContext = {}; // global context
  }

  /**
   * Execute AST
   * @param {[]} ast
   * @param {Context} context
   * @param {string[]} buffer - output buffer
   * @private
   */
  _execute(ast, context, buffer) {

    if (this._depth === MAX_EXECUTION_DEPTH) {
      throw new Errors.MaxExecutionDepthReachedError(
        // Since anything greater than zero means a recurring call
        // from the entry base block, __LINE__ will be defined in context.
        // MAX_INCLUDE_DEPTH == 0 doesn't allow execution at all.
        `Maximum execution depth reached, possible cyclic reference? (${context.__FILE__}:${context.__LINE__})`
      );
    }

    this._depth++;

    for (const instruction of ast) {

      // set __LINE__
      context = this._mergeContexts(
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
          throw new Errors.ExpressionEvaluationError(`${e.message} (${context.__FILE__}:${context.__LINE__})`);
        } else if (e instanceof AbstractReader.Errors.SourceReadingError) {
          throw new Errors.SourceInclusionError(`${e.message} (${context.__FILE__}:${context.__LINE__})`);
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
   * @param {Context} context
   * @param {string[]} buffer
   * @private
   */
  _executeInclude(instruction, context, buffer) {

    const macro = this.expression.parseMacroCall(
      instruction.value,
      this._mergeContexts(this._globalContext, context),
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
   * Include source
   * @param {string} source
   * @param {Context} context
   * @param {string[]} buffer
   * @param {boolean=false} once
   * @param {boolean=false} evaluated - is source ref already evaluated?
   * @private
   */
  _includeSource(source, context, buffer, once, evaluated) {

    // path is an expression, evaluate it
    let includePath = evaluated ? source : this.expression.evaluate(
        source, this._mergeContexts(this._globalContext, context)
      );

    // if once flag is set, then check if source has alredy been included
    if (once && this._includedSources.has(includePath)) {
      this.logger.debug(`Skipping source "${includePath}": has already been included`);
      return;
    }

    let reader = this._getReader(includePath);
    let needCache = false;
    if (this._toBeCached(includePath) && this._isCachedReader(reader)) {
        if (Machine._isFileExist(includePath)) {
          // change reader to local reader
          const fileName = Machine._normalizePath(includePath);
          includePath = fileName.dirPath + '/' + fileName.fileName;
          reader = this.readers.file;
        } else {
          needCache = true;
        }
    }
    const includePathParsed = reader.parsePath(includePath);

    // provide filename for correct error messages
    this.parser.file = includePathParsed.__FILE__;

    // read
    this.logger.info(`Including source "${includePath}"`);
    let content = reader.read(includePath);

    // if content doesn't have line separator at the end, then add it
    if (content.length > 0 && content[content.length - 1] != '\n') {
        content += '\n';
    }

    if (needCache && this.useCache) {
      this.logger.debug(`Caching file "${includePath}"`);
      this._cacheFile(includePath, content);
    }

    // parse
    const ast = this.parser.parse(content);

    // update context

    // __FILE__/__PATH__
    context = this._mergeContexts(
      context,
      includePathParsed
    );

    // store included source
    this._includedSources.add(includePath);

    // execute included AST
    this._execute(ast, context, buffer);
  }

  /**
   * Include macro
   * @param {Object} macro
   * @property {string[]} name
   * @property {string[]} args
   * @param {Context} context
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
      this._mergeContexts(context, macroContext),
      buffer
    );
  }

  /**
   * Execute "output" instruction
   * @param {{type, value, computed}} instruction
   * @param {Context} context
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
          this._mergeContexts(this._globalContext, context)
        )),
        context,
        buffer
      );

    }
  }

  /**
   * Execute "set" instruction
   * @param {{type, variable, value}} instruction
   * @param {Context} context
   * @param {string[]} buffer
   * @private
   */
  _executeSet(instruction, context, buffer) {
    this._globalContext[instruction.variable] =
      this.expression.evaluate(instruction.value,
        this._mergeContexts(this._globalContext, context));
  }

  /**
   * Execute "error: instruction
   * @param {{type, value}} instruction
   * @param {Context} context
   * @param {string[]} buffer
   * @private
   */
  _executeError(instruction, context, buffer) {
    throw new Errors.UserDefinedError(
      this.expression.evaluate(instruction.value,
        this._mergeContexts(this._globalContext, context))
    );
  }

  /**
   * Execute "conditional" instruction
   * @param {{type, test, consequent, alternate, elseifs}} instruction
   * @param {Context} context
   * @param {string[]} buffer
   * @private
   */
  _executeConditional(instruction, context, buffer) {

    const test = this.expression.evaluate(
      instruction.test,
      this._mergeContexts(this._globalContext, context)
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
   * @param {Context} context
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
        ` (${context.__FILE__}:${context.__LINE__})`
      );
    }

    // save macro
    this._macros[macro.name] = {
      file: context.__FILE__, // file at declaration
      path: context.__PATH__, // path at declaration
      line: context.__LINE__, // line of eclaration
      args: macro.args,
      body: instruction.body
    };

    // add macro to supported function in expression expression
    this._globalContext[macro.name] = ((macro) => {
      return (args, context) => {
        const buffer = [];
        macro.args = args;

        // include macro in inline mode
        this._includeMacro(
          macro,
          /* enable inline mode for all subsequent operations */
          this._mergeContexts(context, {__INLINE__: true}),
          buffer
        );

        // trim trailing newline (only in inline mode for macros)
        this._trimLastLine(buffer);

        return buffer.join('');
      };
    })(macro);
  }

  /**
   * Execute loop instruction
   * @param {{type, while, rereat, body: []}} instruction
   * @param {Context} context
   * @param {string[]} buffer
   * @private
   */
  _executeLoop(insruction, context, buffer) {

    let index = 0;

    while (true) {
      // evaluate test expression
      const test = this._expression.evaluate(
        insruction.while || insruction.repeat,
        this._mergeContexts(this._globalContext, context)
      );

      // check break condition
      if (insruction.while && !test) {
        break;
      } else if (insruction.repeat && test === index) {
        break;
      }

      // execute body
      this._execute(
        insruction.body,
        this._mergeContexts(
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
   * Perform outoput operation
   * @param {string|string[]} output
   * @param {Context} context
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
   * Merge local context with global
   * @param {...Context} - contexts
   * @private
   */
  _mergeContexts() {
    const args = Array.prototype.slice.call(arguments);

    // clone target
    let target = args.shift();
    target = clone(target);
    args.unshift(target);

    return Object.assign.apply(this, args);
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
   * Create folder if path exists
   * @param {string} dirPath path to directory
   * @private
   */
  _mkdirSync(dirPath) {
    try {
      fs.mkdirSync(dirPath);
    } catch (err) {
      // if it is not "Exist error" then log it
      if (err.code !== 'EEXIST') this.logger.error(err);
    }
  }

  /**
   * Create all missing folders in the current path
   * @param {string} dirPath path to directory
   * @private
   */
  _mkdirpSync(dirPath) {
    const parts = dirPath.split(/[\\|\/]/);

    // For every part of our path, call our wrapped _mkdirSync()
    // on the full path until and including that part
    for (let i = 1; i <= parts.length; i++) {
      this._mkdirSync(path.join.apply(null, parts.slice(0, i)));
    }
  }

  /**
   * Create file with fileName path
   * @param {string} fileName path to file
   * @param {string} fileContent Content of the file
   * @private
   */
  _createFile(fileName, fileContent) {
    try {
      fs.writeFileSync(fileName, fileContent);
    } catch (err) {
       this.logger.error(err);
    }
  }

  /**
   * @typedef {Object} NormalizedPath
   * @property {string} fileName
   * @property {string} dirPath
   */

  /**
   * Transform url or github link to path and filename
   * It is important, that path and filename are unique,
   * because collision can break the build
   * @param {string} link link to the file
   * @return {NormalizedPath} folder and name, where cache file can be found
   * @private
   */
  static _normalizePath(link) {
    const ghRes = GithubReader._parse(link);
    if (ghRes !== false) {
      return this._normalizeGithubPath(ghRes);
    }
    if (new HttpReader().supports(link)) { // CHANGE THIS
      return this._normalizeHttpPath(link);
    }
  }

  /**
   * Transform github link to path and filename
   * @param {string} link link to the file
   * @return {NormalizedPath} folder and name, where cache file can be found
   * @private
   */
  static _normalizeHttpPath(httpLink) {
    // parse url parts
    const parsedUrl = (/^((http[s]?):\/)?\/?([^:\/\s]+)((\/[\w\-\.]+)*\/)([\w\-\.]+[^#?\s]+)(.*)?(#[\w\-]+)?$/.exec(httpLink));
    const domen = parsedUrl[3].split('.'); // it is web-site name
    // create new path from url
    const newPath = this.cacheDir + HTTP_DIR + '/' + domen.filter((elem) => elem != 'www').reverse().join('/') +  (parsedUrl[4] ? parsedUrl[4] : '');
    const fileName = parsedUrl[6];
    return { 'dirPath' : newPath,
             'fileName' : fileName};
  }

  /**
   * Transform url link to path and filename
   * @param {{user, repo, path, ref}} ghRes github parsed link to the file
   * @return {NormalizedPath} folder and name, where cache file can be found
   * @private
   */
  static _normalizeGithubPath(ghRes) {
    // find, where fileName starts
    const i = ghRes.path.lastIndexOf('/');
    let newPath;
    let fileName;
    // check case, when filename goes after user and repo
    if (i != -1) {
      newPath = ghRes.path.substr(0, i);
      fileName = ghRes.path.substr(i + 1);
    }
    return {
      'dirPath' : this.cacheDir + GITHUB_DIR + '/' + ghRes.user + '/' + ghRes.repo + (ghRes.ref ? '/' + ghRes.ref : '') + (i != -1 ? '/' + newPath : ''),
      'fileName' : (i != -1 ? fileName : ghRes.path)
    };
  }

  /**
   * Create all subfolders and write file to them
   * @param {string} path path to the file
   * @param {string} content content of the file
   * @private
   */
  _cacheFile(path, content) {
    const file = Machine._normalizePath(path);
    const finalPath = file.dirPath + '/' + file.fileName;
    if (!fs.existsSync(finalPath)) {
      this._mkdirpSync(file.dirPath);
      this._createFile(finalPath, content);
    }
  }

  /**
   * Check, is file exist by link
   * @param {string} link link to the file
   * @return {boolean} result
   * @private
   */
  static _isFileExist(link) {
    const file = Machine._normalizePath(link);
    const finalPath = file.dirPath + '/' + file.fileName;
    return fs.existsSync(finalPath);
  }

  /**
   * Check, has reader to be cached
   * @param {AbstractReader} reader
   * @return {boolean} result
   * @private
   */
  _isCachedReader(reader) {
    return CACHED_READERS.some((cachedReader) => (reader instanceof cachedReader));
  }

  /**
   * Delete folder and all subfolders and files
   * @param {string} path
   * @private
   */
  _deleteFolderRecursive(path) {
    try {
      if( fs.existsSync(path) ) {
        fs.readdirSync(path).forEach(function (file, index) {
          var curPath = path + '/' + file;
          if(fs.lstatSync(curPath).isDirectory()) { // recurse
            this._deleteFolderRecursive(curPath);
          } else { // delete file
            fs.unlinkSync(curPath);
          }
        }.bind(this));
        fs.rmdirSync(path); // delete directory
      } else {
        this.logger.error(`Can't delete ${path}, because it does not exist`);
      }
    } catch (err) {
       this.logger.error(err);
    }
  };

  /**
   * Check, has file to be excluded from cache
   * @param {string} path to the file
   * @return {boolean} result
   * @private
   */
  _isExcludedFromCache(includedPath) {
    return this._excludeList.some((regexp) => regexp.test(includedPath));
  }

  _toBeCached(includePath) {
    return this.useCache && !this._isExcludedFromCache(includePath);
  }

  cleanCache() {
    this._deleteFolderRecursive(this.cacheDir);
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
   * Generate line control statements?
   * @see https://gcc.gnu.org/onlinedocs/cpp/Line-Control.html
   * @return {boolean}
   */
  get useCache() {
    return this._useCache || false;
  }

  /**
   * @param {boolean} value
   */
  set useCache(value) {
    this._useCache = value;
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

  set cacheDir(value) {
    this._cacheDir = value;
  }

   get cacheDir() {
    return this._cacheDir;
  }

  set globals(value) {
    this._globals = value;
  }

  get excludeList() {
    return this._excludeList;
  }

  /**
   * Construct exclude regexp list from filename
   * @param {string} name of exclude file. '' for default
   */
  set excludeList(fileName) {
    if (fileName == '') {
      fileName = DEFAULT_EXCLUDE_FILE_NAME;
    }

    const newPath = fileName;
    // check is fileName exist
    if (!fs.existsSync(newPath)) {
      if (fileName == DEFAULT_EXCLUDE_FILE_NAME) {
        // if it isn't exist and it is default, then put empty list
        this._excludeList = [];
        return;
      } else {
        throw new Error(`${newPath} file does not exist`);
      }
    }

    const content = fs.readFileSync(newPath, 'utf8');
    const filenames = content.split(/\n|\r\n/);
    // filters not empty strings, and makes regular expression from template
    const patterns = filenames.map((value) => value.trimLeft()) // trim for "is commented" check
                              .filter((value) => (value != '' && value[0] != '#'))
                              .map((value) => minimatch.makeRe(value));
    this._excludeList = patterns;
  }
  // </editor-fold>
}

module.exports = Machine;
module.exports.INSTRUCTIONS = INSTRUCTIONS;
module.exports.Errors = Errors;

