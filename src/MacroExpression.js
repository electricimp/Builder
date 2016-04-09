/**
 * Macro declaration and call parser
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

const jsep = require('jsep');

const Errors = {
  'SyntaxError': class SyntaxError extends Error {
  }
};

class MacroExpression {

  constructor() {
    this._reset();
  }

  /**
   * Parse macro declartion
   * @param source
   */
  parseDeclaration(source) {
    this._reset();
    const root = jsep(source);

    if (root.type !== 'CallExpression' || root.callee.type !== 'Identifier') {
      throw new Errors.SyntaxError(`Syntax error in macro declaration`);
    }

    this.macroName = root.callee.name;

    for (const arg of root.arguments) {
      if (arg.type !== 'Identifier') {
        throw new Errors.SyntaxError(`Syntax error in macro declaration`);
      }

      this.args.push(arg.name);
    }
  }

  parseCall(source, context) {

  }

  _reset() {
    this.args = [];
    this.macroName = '';
  }

  get args() {
    return this._args;
  }

  set args(value) {
    this._args = value;
  }

  get macroName() {
    return this._macroName;
  }

  set macroName(value) {
    this._macroName = value;
  }

}

module.exports = MacroExpression;
module.exports.Errors = Errors;
