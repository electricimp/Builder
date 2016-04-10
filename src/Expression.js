/**
 * Expression evaluator
 * @author Mikhail Yurasov <me@yurasov.me>
 */

/**
 * Supported syntax:
 *
 * Binary operators:
 * =================
 *
 * || && == != < > <= >= + - * / %
 *
 * Unary operators:
 * ================
 *
 * + - !
 *
 * Member expressions:
 * ===================
 *
 * foo.bar
 * foo["bar"]
 * ([1, 2, 3])[1]
 *
 * Types:
 * ======
 *
 *  true
 *  false
 *  null
 *  "string" 'literals'
 *  numbers: 1, 2, 3, 1.1005000, 1E6 1E-6, 1e6
 *
 * Conditional expressions:
 * ========================
 *
 *  result = test ? consequent : alternate
 *
 * Array expressions:
 * ==================
 *
 *  [1, 2, 3]
 *
 * Also @see https://github.com/soney/jsep/blob/master/src/jsep.js
 */

'use strict';

const jsep = require('jsep');

const Errors = {
  'NotMacroError': class NotMacroError extends Error {
  },
  'MacroDeclarationError': class MacroDeclarationError extends Error {
  },
  'FunctionCallError': class FunctionCallError extends Error {
  }
};

class Expression {

  constructor() {
    // configure JSEP

    this._jsep = jsep;

    // remove binary ops
    this._jsep.removeBinaryOp('!==');
    this._jsep.removeBinaryOp('===');
    this._jsep.removeBinaryOp('>>');
    this._jsep.removeBinaryOp('<<');
    this._jsep.removeBinaryOp('>>>');
    this._jsep.removeBinaryOp('&');
    this._jsep.removeBinaryOp('^');
    this._jsep.removeBinaryOp('|');

    // remove unary ops
    this._jsep.removeUnaryOp('~');

    // supported dunctions
    this._supportedFunctions = ['abs', 'max', 'min', 'defined'];
  }

  /**
   * Evaluate an expression
   * @param {string} expression
   * @param {{}={}} context - defined variables
   * @return {*}
   */
  evaluate(expression, context) {
    return this._evaluate(this._jsep(expression), context || {});
  }

  /**
   * Parse macro call expression
   * @param {string} text - expression text
   * @param {{}} context - context
   * @param {{}} macros - defined macroses
   * @return {{name, args: []}}
   */
  parseMacroCall(text, context, definedMacroses) {
    const root = this._jsep(text);

    if (root.type !== 'CallExpression' || root.callee.type !== 'Identifier'
        || !definedMacroses.hasOwnProperty(root.callee.name)) {
      // not a macro
      throw new Errors.NotMacroError();
    }

    return {
      name: root.callee.name,
      args: root['arguments'].map(v => this._evaluate(v, context))
    };
  }

  /**
   * Parse macro declartion
   * @param text - declaration text
   * @return {{name, args: []}}
   */
  parseMacroDeclaration(text) {
    const root = this._jsep(text);

    if (root.type !== 'CallExpression' || root.callee.type !== 'Identifier') {
      throw new Errors.MacroDeclarationError(`Syntax error in macro declaration`);
    }

    for (const arg of root['arguments']) {
      if (arg.type !== 'Identifier') {
        throw new Errors.MacroDeclarationError(`Syntax error in macro declaration`);
      }
    }

    return {
      name: root.callee.name,
      args: root['arguments'].map(v => v.name)
    };
  }

  /**
   * @param {{}} node
   * @param {{}} context - defined variables
   * @private
   */
  _evaluate(node, context) {

    let res;

    // walk through the AST

    switch (node.type) {

      case 'BinaryExpression':
      case 'LogicalExpression':

        const left = this._evaluate(node.left, context);
        const right = this._evaluate(node.right, context);

        switch (node.operator) {

          case '-':
            res = left - right;
            break;

          case '+':
            res = left + right;
            break;

          case '*':
            res = left * right;
            break;

          case '/':

            if (0 === right) {
              throw new Error('Division by zero');
            }

            res = left / right;
            break;

          case '%':

            if (0 === right) {
              throw new Error('Division by zero');
            }

            res = left % right;
            break;

          case '||':
            res = left || right;
            break;

          case '&&':
            res = left && right;
            break;

          case '==':
            res = left == right;
            break;

          case '!=':
            res = left != right;
            break;

          case '>':
            res = left > right;
            break;

          case '<':
            res = left < right;
            break;

          case '>=':
            res = left >= right;
            break;

          case '<=':
            res = left <= right;
            break;
        }

        break;

      case 'Literal':

        res = node.value;
        break;

      case 'Identifier':

        if (this._supportedFunctions.indexOf(node.name) !== -1) /* function name */ {
          res = node.name;
        } else /* variable */ {
          res = context.hasOwnProperty(node.name)
            ? context[node.name] : null;
        }

        break;

      case 'UnaryExpression':

        const argument = this._evaluate(node.argument, context);

        switch (node.operator) {

          case '+':
            res = argument;
            break;

          case '!':
            res = !argument;
            break;

          case '-':
            res = -argument;
            break;

          default:
            throw new Error('Unknown unary operator: ' + node.operator);
        }

        break;

      case 'Compound':
        throw new Error('Syntax error');

      case 'MemberExpression':

        const object = this._evaluate(node.object, context);
        const property = node.computed ? this._evaluate(node.property, context) : node.property.name;

        if (!object.hasOwnProperty(property)) {
          throw new Error(`Property "${property} is not defined`);
        }

        res = object[property];

        break;

      case 'ThisExpression':
        throw new Error('`this` keyword is not supported');

      case 'ConditionalExpression':
        const test = this._evaluate(node.test, context);

        if (test) {
          res = this._evaluate(node.consequent, context);
        } else {
          res = this._evaluate(node.alternate, context);
        }

        break;

      case 'ArrayExpression':

        res = node.elements.map(v => this._evaluate(v, context));
        break;

      case 'CallExpression':

        const callee = this._evaluate(node.callee, context);

        if ('defined' === callee) {

          // defined(varName) should not evaluate variable
          if ('Identifier' !== node.arguments[0].type) {
            throw new Error('defined() can only be called with an identifier as an argument');
          }

          res = context.hasOwnProperty(node.arguments[0].name);

        } else {

          const args = node.arguments.map(v => this._evaluate(v, context));

          switch (callee) {
            case 'abs':
            case 'max':
            case 'min':

              if (args.length < 1) {
                throw new Error('Wrong number of arguments for ' + callee + '()');
              }

              res = Math[callee].apply(this, args);
              break;

            default:

              if (node.callee.type === 'Identifier') {
                throw new Errors.FunctionCallError(`Function "${node.callee.name}" is not defined`);
              } else if (typeof callee === 'string' || callee instanceof String) {
                throw new Errors.FunctionCallError(`Function "${callee}" is not defined`);
              } else {
                throw new Errors.FunctionCallError(`Can't call a non-callable expression`);
              }
          }

        }

        break;

      default:
        throw new Error('Unknown node type: "' + node.type + '"');
    }

    return res;

  }
}

module.exports = Expression;
module.exports.Errors = Errors;
