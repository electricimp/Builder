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
 * Filter operator
 * ===============
 *
 * |
 *
 * value|filter === filter(value)
 * value|filter(arg) === filter(value, arg)
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

// <editor-fold desc="Errors" defaultstate="collapsed">
const Errors = {};

Errors.ExpressionError = class ExpressionError extends Error {
};

Errors.MacroDeclarationError = class MacroDeclarationError extends Errors.ExpressionError {
};

Errors.FunctionCallError = class FunctionCallError extends Errors.ExpressionError {
};
// </editor-fold>

class Expression {

  constructor() {
    this.functions = {};
    this._initParser();
  }

  /**
   * Confugure parser
   * @private
   */
  _initParser() {
    this._jsep = jsep;

    // remove binary ops
    this._jsep.removeBinaryOp('!==');
    this._jsep.removeBinaryOp('===');
    this._jsep.removeBinaryOp('>>');
    this._jsep.removeBinaryOp('<<');
    this._jsep.removeBinaryOp('>>>');
    this._jsep.removeBinaryOp('&');
    this._jsep.removeBinaryOp('^');

    // remove unary ops
    this._jsep.removeUnaryOp('~');
  }

  /**
   * Evaluate an expression
   * @param {string} expression
   * @param {{}={}} context - defined variables
   * @return {*}
   */
  evaluate(expression, context) {
    try {
      return this._evaluate(this._jsep(expression), context || {});
    } catch (e) {

      // rethrow errors with a custom type
      if (!(e instanceof Errors.ExpressionError)) {
        throw new Errors.ExpressionError(e.message);
      }

      throw e;
    }
  }

  /**
   * Parse macro call expression
   * @param {string} text - expression text
   * @param {{}} context - context
   * @param {{}} macros - defined macroses
   * @return {{name, args: []}|null}
   */
  parseMacroCall(text, context, definedMacroses) {
    let root;

    try {
      root = this._jsep(text);
    } catch (e) {
      return null;
    }

    if (root.type !== 'CallExpression' || root.callee.type !== 'Identifier'
        || !definedMacroses.hasOwnProperty(root.callee.name)) {
      // not a macro
      return null;
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
   * @throws {Errors.MacroDeclarationError}
   */
  parseMacroDeclaration(text) {
    let root;

    try {
      root = this._jsep(text);
    } catch (e) {
      // rethrow as custom error type
      throw new Errors.ExpressionError(e.message);
    }

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

        // check that we have both left and right parts
        if (node.left === false || node.right === false) {
          throw new Errors.ExpressionError('Syntax error in "' + node.operator + '" operator');
        }

        if ('|' === node.operator /* filter operator */) {

          if (node.right.type === 'CallExpression' /* value|filter() */) {

            // set left-hand expression as the first argument
            node.right.arguments.unshift(node.left);
            res = this._evaluate(node.right, context);

          } else /* value|filter */{

            // construct call expression
            const filterCallExpression = {
              type: 'CallExpression',
              arguments: [node.left],
              callee: node.right
            };

            res = this._evaluate(filterCallExpression, context);
          }

        } else {

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
                throw new Errors.ExpressionError('Division by zero');
              }

              res = left / right;
              break;

            case '%':

              if (0 === right) {
                throw new Errors.ExpressionError('Division by zero');
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

            default:
              throw new Errors.ExpressionError('Unknown binary operator: ' + node.operator);
          }
        }

        break;

      case 'Literal':

        res = node.value;
        break;

      case 'Identifier':

        if /* call expression callee name */ (
          'defined' === node.name ||
          context.hasOwnProperty(node.name) && typeof context[node.name] === 'function'
        ) {
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
            throw new Errors.ExpressionError('Unknown unary operator: ' + node.operator);
        }

        break;

      case 'Compound':
        throw new Errors.ExpressionError('Syntax error');

      case 'MemberExpression':

        const object = this._evaluate(node.object, context);
        const property = node.computed ? this._evaluate(node.property, context) : node.property.name;

        if (!object.hasOwnProperty(property)) {
          throw new Errors.ExpressionError(`Property "${property} is not defined`);
        }

        res = object[property];

        break;

      case 'ThisExpression':
        throw new Errors.ExpressionError('`this` keyword is not supported');

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

        // "defined" is not a function, but a syntactic construction
        if ('defined' === callee) {

          // defined(varName) should not evaluate variable
          if ('Identifier' !== node.arguments[0].type) {
            throw new Errors.ExpressionError('defined() can only be called with an identifier as an argument');
          }

          res = context.hasOwnProperty(node.arguments[0].name);

        } else {

          const args = node.arguments.map(v => this._evaluate(v, context));

          if (context.hasOwnProperty(callee) && typeof context[callee] === 'function') {
            res = context[callee](args, context);
          } else {

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
        throw new Errors.ExpressionError('Unknown node type: "' + node.type + '"');
    }

    return res;

  }
}

module.exports = Expression;
module.exports.Errors = Errors;
