// MIT License
//
// Copyright 2016-2017 Electric Imp
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

const jsep = require('jsep');
const decomment = require('decomment');
// instruction types
const INSTRUCTIONS = require('./Machine').INSTRUCTIONS;

// states
const STATES = {
  OK: 'ok',
  MACRO: 'macro',
  WHILE: 'while',
  REPEAT: 'repeat',
  IF_ELSEIF: 'if_elseif',
  IF_ALTERNATE: 'if_alternate',
  IF_CONSEQUENT: 'if_consequent'
};

// token types
const TOKENS = {
  IF: 'if',
  END: 'end',
  SET: 'set',
  ELSE: 'else',
  MACRO: 'macro',
  WHILE: 'while',
  ENDIF: 'endif',
  REPEAT: 'repeat',
  ELSEIF: 'elseif',
  INCLUDE: 'include',
  ENDWHILE: 'endwhile',
  ENDMACRO: 'endmacro',
  ENDREPEAT: 'endrepeat',
  SOURCE_FRAGMENT: 'source_fragment',
  INLINE_EXPRESSION: 'inline_expression',
  WARNING: 'warning',
};

// lines gobbling regex
const LINES = /(.*(?:\r\n|\n)?)/g;

// regex to detect if fragment is a directive
const DIRECTIVE = /^\s*@(include|set|if|else|elseif|endif|error|macro|endmacro|end|while|endwhile|repeat|endrepeat|warning)\b(.*?)\s*$/;

// @-style comments regex
const COMMENT = /^\s*@\s/;

const Errors = {
  'SyntaxError': class SyntaxError extends Error {
  }
};

/**
 * AST parser
 * Converts source into AST that can be interpreted by Builder VM
 */
class AstParser {

  constructor() {
    this._initParser();
  }

  /**
   * Parse source into AST
   *
   * @param {string} source
   * @return [] Root-level base block
   */
  parse(source) {
    return this._parse(
      this._tokenize(source), [], STATES.OK
    );
  }

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
   * Returns tokens generator
   * @param {string} source
   * @private
   */
  * _tokenize(source) {

    let matches, type, arg;
    const lines = source.match(LINES);

    for (let i = 0; i < lines.length - 1 /* last line is always empty */; i++) {
      const text = lines[i];

      if (matches = text.match(DIRECTIVE)) {
        const token = {_line: 1 + i};

        type = matches[1];
        arg = matches[2].trim();
        token.args = [];

        // remove single line comments from arg
        arg = decomment.text(arg);

        switch (type) {

          case 'include':
            // detect "once" flag
            if (/^once\b/.test(arg)) {
              token.args.push('once');
              arg = arg.substr(5).trim();
            }

            this._checkArgumentIsNonempty(type, arg, token._line);
            token.type = TOKENS.INCLUDE;
            token.args.push(arg);
            break;

          case 'set':
            // split arg
            matches = arg.match(/^([_$A-Za-z][_A-Za-z0-9]*)\s*(?:=\s*)?(.*?)$/);

            if (!matches || '' === matches[2]) {
              throw new Errors.SyntaxError(`Syntax error in @set (${this.file}:${token._line})`);
            }

            token.args.push(matches[1]);
            token.args.push(matches[2]);
            token.type = TOKENS.SET;
            break;

          case 'if':
            this._checkArgumentIsNonempty(type, arg, token._line);
            token.type = TOKENS.IF;
            token.args.push(arg);
            break;

          case 'else':
            this._checkArgumentIsEmpty(type, arg, token._line);
            token.type = TOKENS.ELSE;
            break;

          case 'elseif':
            this._checkArgumentIsNonempty(type, arg, token._line);
            token.type = TOKENS.ELSEIF;
            token.args.push(arg);
            break;

          case 'endif':
            this._checkArgumentIsEmpty(type, arg, token._line);
            token.type = TOKENS.ENDIF;
            break;

          case 'error':
            this._checkArgumentIsNonempty(type, arg, token._line);
            token.type = TOKENS.ERROR;
            token.args.push(arg);
            break;

          case 'warning':
            this._checkArgumentIsNonempty(type, arg, token._line);
            token.type = TOKENS.WARNING;
            token.args.push(arg);
            break;

          case 'macro':
            this._checkArgumentIsNonempty(type, arg, token._line);
            token.type = TOKENS.MACRO;
            token.args.push(arg);
            break;

          case 'endmacro':
            this._checkArgumentIsEmpty(type, arg, token._line);
            token.type = TOKENS.ENDMACRO;
            break;

          case 'end':
            this._checkArgumentIsEmpty(type, arg, token._line);
            token.type = TOKENS.END;
            break;

          case 'while':
            this._checkArgumentIsNonempty(type, arg, token._line);
            token.type = TOKENS.WHILE;
            token.args.push(arg);
            break;

          case 'endwhile':
            this._checkArgumentIsEmpty(type, arg, token._line);
            token.type = TOKENS.ENDWHILE;
            break;

          case 'repeat':
            this._checkArgumentIsNonempty(type, arg, token._line);
            token.type = TOKENS.REPEAT;
            token.args.push(arg);
            break;

          case 'endrepeat':
            this._checkArgumentIsEmpty(type, arg, token._line);
            token.type = TOKENS.ENDREPEAT;
            break;

          default:
            throw new Errors.SyntaxError(`Unsupported directive "${type}" (${this.file}:${token.line})`);
        }

        yield token;
      } else if (text.match(COMMENT)) {
        // do nothing
      } else {
        // split source fragment into computed/uncomputed chunks
        yield* this._tokenizeSourceFragment(text, 1 + i);
      }
    }
  }

  /**
   * Split source fragment into computed/uncomputed chunks
   * @param {string} fragment
   * @param {number} line #
   * @private
   */
  * _tokenizeSourceFragment(fragment, line) {

    let matches;

    // extract source fragments and inline expressions
    while (matches = /@{(.*?)}/.exec(fragment)) {

      let expArg = null;
      let parsed = false;
      let argLen = fragment.length - matches.index - 3; // 3 = length("@{}")

      // find a sequence of a maximum length that is a valid expression
      while (argLen >= 0) {
        try {
          expArg = fragment.substr(matches.index + 2, argLen); // 2 = length("@{")
          this._jsep(expArg);
          parsed = true;
          break;
        } catch (e) {
          // take it easy and keep trying
        }
        argLen--;
      }

      if (!parsed || fragment.charAt(matches.index + 2 + argLen) != '}') {
        throw new Errors.SyntaxError(`Syntax error in the inline instruction at (${this.file}:${line})`);
      }

      // push source fragment
      if (matches.index > 0) {
        yield {
          _line: line,
          type: TOKENS.SOURCE_FRAGMENT,
          args: [fragment.substr(0, matches.index)]
        };
      }

      // push inline expression
      yield {
        _line: line,
        type: TOKENS.INLINE_EXPRESSION,
        args: [expArg]
      };

      fragment = fragment.substr(matches.index + 2 + argLen + 1); // match.index + length("@{") + length(arg) + length("}")
    }

    // push last source fragment
    if (fragment !== '') {
      yield {
        _line: line,
        type: TOKENS.SOURCE_FRAGMENT,
        args: [fragment]
      };
    }
  }

  /**
   *  Check that argument is not empty
   * @param {string} keyword
   * @param {string} arg
   * @param line
   * @private
   */
  _checkArgumentIsNonempty(keyword, arg, line) {
    if ('' === arg) {
      throw new Errors.SyntaxError(`Syntax error in @${keyword} (${this.file}:${line})`);
    }
  }

  /**
   *  Check that argument is not empty
   * @param {string} keyword
   * @param {string} arg
   * @param line
   * @private
   */
  _checkArgumentIsEmpty(keyword, arg, line) {
    if ('' !== arg) {
      throw new Errors.SyntaxError(`Syntax error in @${keyword} (${this.file}:${line})`);
    }
  }

  /**
   * Parse source into AST
   *
   * @param {[]} tokens
   * @param source
   * @param {*} parent
   * @param {string} state
   * @return {*}
   * @private
   */
  _parse(tokens, parent, state) {

    let token;
    let next = tokens.next();

    while (!next.done) {

      token = next.value;

      const node = {
        _line: token._line
      };

      // keep track of the last processed line to generate the correct error message
      this._lastLine = token._line;

      switch (token.type) {

        // @include <path:expression>
        case TOKENS.INCLUDE:

          node.type = INSTRUCTIONS.INCLUDE;
          node.once = token.args.length > 1 && 'once' === token.args.shift();
          node.value = token.args.shift();
          this._append(parent, node, state);

          break;

        // @set <variable:varname> <value:expression>
        case TOKENS.SET:

          node.type = INSTRUCTIONS.SET;
          node.variable = token.args[0];
          node.value = token.args[1];
          this._append(parent, node, state);

          break;

        // @error <message:expression>
        case TOKENS.ERROR:

          node.type = INSTRUCTIONS.ERROR;
          node.value = token.args[0];
          this._append(parent, node, state);

          break;

        // @warning <message:expression>
        case TOKENS.WARNING:

          node.type = INSTRUCTIONS.WARNING;
          node.value = token.args[0];
          this._append(parent, node, state);

          break;

        // @if <condition:expression>
        case TOKENS.IF:

          node.type = INSTRUCTIONS.CONDITIONAL;
          node.test = token.args[0];
          node.consequent = [];
          this._append(parent, node, state);
          this._parse(tokens, node, STATES.IF_CONSEQUENT);

          break;

        case TOKENS.ELSE:

          switch (state) {

            case STATES.IF_CONSEQUENT:
            case STATES.IF_ALTERNATE:
            case STATES.IF_ELSEIF:

              if (parent.alternate) {
                throw new Errors.SyntaxError(`Multiple @else statements are not allowed (${this.file}:${node._line})`);
              }

              parent.alternate = [];
              state = STATES.IF_ALTERNATE;
              break;

            default:
              throw new Errors.SyntaxError(`Unexpected @else (${this.file}:${node._line})`);
          }

          break;

        case TOKENS.ELSEIF:

          switch (state) {

            case STATES.IF_CONSEQUENT:
            case STATES.IF_ELSEIF:

              // save as IF instruction
              node.type = INSTRUCTIONS.CONDITIONAL;
              node.test = token.args[0];
              node.consequent = [];

              // add node to elseifs block
              if (!parent.elseifs) parent.elseifs = [];
              parent.elseifs.push(node);

              state = STATES.IF_ELSEIF;

              break;

            case STATES.IF_ALTERNATE:
              throw new Errors.SyntaxError(`@elseif after @else is not allowed (${this.file}:${node._line})`);

            default:
              throw new Errors.SyntaxError(`Unexpected @elseif (${this.file}:${node._line})`);
          }

          break;

        case TOKENS.ENDIF:

          switch (state) {
            case STATES.IF_CONSEQUENT:
            case STATES.IF_ALTERNATE:
            case STATES.IF_ELSEIF:
              // we got here through recursion, get back
              return;

            default:
              throw new Errors.SyntaxError(`Unexpected @endif (${this.file}:${node._line})`);
          }

          break;

        // source fragment
        case TOKENS.SOURCE_FRAGMENT:

          node.type = INSTRUCTIONS.OUTPUT;
          node.value = token.args.join('');
          node.computed = true;
          this._append(parent, node, state);

          break;

        // inline expression
        case TOKENS.INLINE_EXPRESSION:

          node.type = INSTRUCTIONS.OUTPUT;
          node.value = token.args[0];
          node.computed = false;
          this._append(parent, node, state);

          break;

        // macro declaration start
        case TOKENS.MACRO:

          node.type = INSTRUCTIONS.MACRO;
          node.declaration = token.args[0];
          node.body = [];
          this._append(parent, node, state);
          this._parse(tokens, node, STATES.MACRO);

          break;

        // end of macro declaration
        case TOKENS.ENDMACRO:

          switch (state) {
            case STATES.MACRO:
              // we got here through recursion, get back
              return;

            default:
              throw new Errors.SyntaxError(`Unexpected @endmacro (${this.file}:${node._line})`);
          }

          break;

        // while declaration start
        case TOKENS.WHILE:

          node.type = INSTRUCTIONS.LOOP;
          node.while = token.args[0];
          node.body = [];
          this._append(parent, node, state);
          this._parse(tokens, node, STATES.WHILE);

          break;

        // end of while declaration
        case TOKENS.ENDWHILE:

          switch (state) {
            case STATES.WHILE:
              // we got here through recursion, get back
              return;

            default:
              throw new Errors.SyntaxError(`Unexpected @endwhile (${this.file}:${node._line})`);
          }

          break;

        // repeat declaration start
        case TOKENS.REPEAT:

          node.type = INSTRUCTIONS.LOOP;
          node.repeat = token.args[0];
          node.body = [];
          this._append(parent, node, state);
          this._parse(tokens, node, STATES.REPEAT);

          break;

        // end of repeat declaration
        case TOKENS.ENDREPEAT:

          switch (state) {
            case STATES.REPEAT:
              // we got here through recursion, get back
              return;

            default:
              throw new Errors.SyntaxError(`Unexpected @endrepeat (${this.file}:${node._line})`);
          }

          break;

        case TOKENS.END:

          switch (state) {
            case STATES.MACRO:
            case STATES.WHILE:
            case STATES.REPEAT:
            case STATES.IF_ELSEIF:
            case STATES.IF_ALTERNATE:
            case STATES.IF_CONSEQUENT:
              // we got here through recursion, get back
              return;

            default:
              throw new Errors.SyntaxError(`Unexpected @end (${this.file}:${node._line})`);
          }

          break;

        default:
          throw new Errors.SyntaxError(`Unsupported token type "${token.type}" (${this.file}:${node._line})`);
      }

      next = tokens.next();
    }

    // check final state
    switch (state) {
      case STATES.OK:
        break;

      case STATES.IF_ALTERNATE:
      case STATES.IF_CONSEQUENT:
      case STATES.IF_ELSEIF:
        throw new Errors.SyntaxError(`Unclosed @if statement (${this.file}:${this._lastLine})`);

      case STATES.MACRO:
        throw new Errors.SyntaxError(`Unclosed @macro statement (${this.file}:${this._lastLine})`);

      case STATES.WHILE:
        throw new Errors.SyntaxError(`Unclosed @while statement (${this.file}:${this._lastLine})`);

      case STATES.REPEAT:
        throw new Errors.SyntaxError(`Unclosed @repeat statement (${this.file}:${this._lastLine})`);

      default:
        throw new Errors.SyntaxError(`Syntax error (${parent.file})`);
    }

    return parent;
  }

  /**
   * Append node to appropriate base block
   *
   * @param {*} parent
   * @param {{}} node
   * @param {string} state
   * @private
   */
  _append(parent, node, state) {
    switch (state) {
      case STATES.OK:
        parent.push(node);
        break;

      case STATES.IF_CONSEQUENT:
        parent.consequent.push(node);
        break;

      case STATES.IF_ALTERNATE:
        parent.alternate.push(node);
        break;

      case STATES.IF_ELSEIF:
        parent.elseifs[parent.elseifs.length - 1].consequent.push(node);
        break;

      case STATES.MACRO:
      case STATES.WHILE:
      case STATES.REPEAT:
        parent.body.push(node);
        break;

      default:
        throw new Errors.SyntaxError(`Unsupported state "${state}"`);
    }
  }

  get file() {
    return this._file || 'main';
  }

  /**
   * Set filename for error messages
   */
  set file(value) {
    this._file = value;
  }
}

module.exports = AstParser;
module.exports.Errors = Errors;
module.exports.INSTRUCTIONS = INSTRUCTIONS;
