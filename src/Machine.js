/**
 * Builder VM
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
    this._if.peek = () => !!this._if[this._if.length - 1]; // get topmost of the stack
  }

  excecute() {
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
          this._if.peek() && this._executeInclude(instruction);
          break;

        case SourceParser.tokens.SOURCE_LINE:
          this._if.peek() && this._executeSourceLine(instruction);
          break;

        case SourceParser.tokens.SET:
          this._if.peek() && this._executeSet(instruction);
          break;

        case SourceParser.tokens.IF:
          this._executeIf(instruction);
          break;

        default:
          throw new Error('Unknown token "' + instruction.token + '"');
      }

      this._pointer++;
    }
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
    const test = this.expression.evaluate('true == ' + instruction.condition);
    this._if.push(test);
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

  // </editor-fold>
}

module.exports = Machine;
