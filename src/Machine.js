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
const SourceParser = require('./SourceParser');

class Machine {

  constructor() {
    this._pointer = 0; // instruction poiner
    this._variables = {};
    this._instructions = [];

    // stack of "if" test results
    this._if = [true];
    this._if.peek = () => !!this._if[this._if.length - 1]; // get topmost element
    this._if.flip = () => this._if[this._if.length - 1] ^= true; // flip the topmost element
  }

  /**
   * Excute set of instructions
   */
  excecute() {
    // clear outpout buffer
    this._output = [];

    let instruction;

    while (this._pointer < this._instructions.length) {

      instruction = this._instructions[this._pointer];

      // assign __*__ variables
      this.expression.variables = Object.assign(
        this._variables,
        {
          __LINE__: instruction._line,
          __FILE__: instruction._file
        }
      );

      switch (instruction.token) {

        case SourceParser.tokens.INCLUDE:

          if (this._if.peek()) {
            this._executeInclude(instruction);
          }

          break;

        case SourceParser.tokens.SOURCE_LINE:

          if (this._if.peek()) {
            this._executeSourceLine(instruction);
          }

          break;

        case SourceParser.tokens.SET:

          if (this._if.peek()) {
            this._executeSet(instruction);
          }

          break;

        case SourceParser.tokens.IF:
          this._executeIf(instruction);
          break;

        case SourceParser.tokens.ELSEIF:
          this._executeElseIf(instruction);
          break;

        case SourceParser.tokens.ELSE:
          this._executeElse(instruction);
          break;

        case SourceParser.tokens.ENDIF:
          this._executeEndIf(instruction);
          break;

        default:
          throw new Error('Unsupported token: "' + instruction.token + '"');
      }

      this._pointer++;
    }

    return this._output.join('\n');
  }

  /**
   * Execute include instruction
   * @param {{}} instruction
   * @private
   */
  _executeInclude(instruction) {

    let content;
    let includedInstrctions;

    // path is an expression, evaluate it
    const sourcePath = this.expression.evaluate(instruction.path);

    if (/^https?:/i.test(instruction.path)) {
      // URL
      throw new Error('Remote sources are not supported at the moment');
    } else if (/\.git\b/i.test(instruction.path)) {
      // GIT
      throw new Error('GIT sources are not supported at the moment');
    } else {
      // local file

      // read
      this.logger.info(`Including local file "${sourcePath}"`);
      content = this.localFileReader.read(sourcePath);

      // parse
      this.sourceParser.sourceName = path.basename(sourcePath);
      includedInstrctions = this.sourceParser.parse(content);
    }

    // replace include instruction with included instructions
    this._instructions.splice.apply(this._instructions,
      [this._pointer, 1].concat(includedInstrctions));

  }

  /**
   * Execute "source line" instruction
   * @param {{}} instruction
   * @private
   */
  _executeSourceLine(instruction) {
    // noop for now
    // todo: replace @{expr} expressions
    this._output.push(instruction.line);
  }

  /**
   * Execute "set" instruction
   * @param {{}} instruction
   * @private
   */
  _executeSet(instruction) {
    const value = this.expression.evaluate(instruction.value);
    this._variables[instruction.variable] = value;
  }

  /**
   * Execute "if" instruction
   * @param {{}} instruction
   * @private
   */
  _executeIf(instruction) {
    const test = this.expression.evaluate(instruction.condition);
    this._if.push(test);
  }

  /**
   * Execute "elseif" instruction
   * @param {{}} instruction
   * @private
   */
  _executeElseIf(instruction) {
    if (this._if.peek()) {
      // if if-clause test was true, then behave like else statement
      this._if.flip();
    } else if (this.expression.evaluate(instruction.condition)) {
      // if if-clause was falsy, then flip to true if else-if test is truthful
      this._if.flip();
    }
  }

  /**
   * Execute "else" instruction
   * @param instruction
   * @private
   */
  _executeElse(instruction) {
    this._if.flip();
  }

  /**
   * Execute "endif" instruction
   * @param {{}} instruction
   * @private
   */
  _executeEndIf(instruction) {
    this._if.pop();
  }

  // <editor-fold desc="Accessors" defaultstate="collapsed">

  get instructions() {
    return this._instructions;
  }

  set instructions(value) {
    this._instructions = value;
  }

  /**
   * @return {LocalFileReader}
   */
  get localFileReader() {
    return this._localFileReader;
  }

  /**
   * @param {LocalFileReader} value
   */
  set localFileReader(value) {
    this._localFileReader = value;
  }

  /**
   * @return {SourceParser}
   */
  get sourceParser() {
    return this._sourceParser;
  }

  /**
   * @param {SourceParser} value
   */
  set sourceParser(value) {
    this._sourceParser = value;
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

  // </editor-fold>
}

module.exports = Machine;
