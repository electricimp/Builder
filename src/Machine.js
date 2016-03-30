/**
 * Builder VM
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

const path = require('path');
const SourceParser = require('./SourceParser');
const Expression = require('./Expression');

class Machine {

  constructor() {
    this._instructions = []; // tokens
    this._pointer = 0; // execution poiner
    this._variables = {};
  }

  excecute() {
    let instruction;

    while (this._pointer < this._instructions.length) {
      instruction = this._instructions[this._pointer];

      switch (instruction.token) {

        case SourceParser.tokens.INCLUDE:
          this._executeInclude(instruction);
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
    let includesInstructions;

    if (/^https?:/i.test(instruction.path)) {
      // URL
      throw new Error('Remote sources are not supported at the moment');
    } else if (/\.git\b/i.test(instruction.path)) {
      // GIT
      throw new Error('GIT sources are not supported at the moment');
    } else {
      // local file

      // read
      content = this.localFileReader.read(instruction.path);

      // parse
      this.sourceParser.sourceName = path.basename(instruction.path);
      includesInstructions = this.sourceParser.parse(content);
    }

    // replace include instruction with included instructions
    this._instructions.splice.apply(this._instructions,
      [this._pointer, 1].concat(includesInstructions));

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
