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
  }

  evaluate(expression) {
    return this._evaluate(jsep(expression));
  }

  /**
   * @param {{}} node
   * @private
   */
  _evaluate(node) {

    let res;

    // walk through the AST

    switch (node.type) {

      case 'BinaryExpression':
      case 'LogicalExpression':

        const left = this._evaluate(node.left);
        const right = this._evaluate(node.right);

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

        // check if we have a variable
        if (!this.variables.hasOwnProperty(node.name)) {
          throw new Error(`Variable "${node.name}" is not defined`);
        }

        res = this.variables[node.name];
        break;

      case 'UnaryExpression':

        const argument = this._evaluate(node.argument);

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

        const object = this._evaluate(node.object);
        const property = node.computed ? this._evaluate(node.property) : node.property.name;

        if (!object.hasOwnProperty(property)) {
          throw new Error(`Property "${property} is not defined`);
        }

        res = object[property];

        break;

      case 'ThisExpression':
        throw new Error('`this` keyword is not supported');

      case 'ConditionalExpression':
        const test = this._evaluate(node.test);

        if (test) {
          res = this._evaluate(node.consequent);
        } else {
          res = this._evaluate(node.alternate);
        }

        break;

      case 'ArrayExpression':

        res = node.elements.map(v => this._evaluate(v));
        break;

      default:
        throw new Error('Unknown node type: "' + node.type + '"');
    }

    return res;

  }

  // <editor-fold desc="Accessors" defaultstate="collapsed">

  get variables() {
    return this._variables || {};
  }

  set variables(value) {
    this._variables = value;
  }

  // </editor-fold>
}

module.exports = Expression;
