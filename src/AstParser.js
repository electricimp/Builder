'use strict';

// instruction types
const INSTRUCTIONS = {
  IF: 'if',
  SET: 'set',
  ERROR: 'error',
  INCLUDE: 'include',
  SOURCE_FRAGMENT: 'source_fragment'
};

const STATES = {
  OK: 'ok',
  IF_ELSEIF: 'if_elseif',
  IF_ALTERNATE: 'if_alternate',
  IF_CONSEQUENT: 'if_consequent'
};

// regex to detect if a like is a statement
const STATEMENT = /^\s*@(include|set|if|else|elseif|endif|error)\b(.*)$/;

class AstParser {

  /**
   * Parse source into AST
   *
   * @param {string} source
   * @return [] Root-level base block
   */
  parse(source) {
    this._pointer = 0; // line pointer
    this._tokens = this._tokenize(source);
    return this._parse([], STATES.OK);
  }

  _tokenize(source) {
    const tokens = source.split(/\n|\r\n/);

    for (const l in tokens) {
      tokens[l] = {
        line: 1 + l,
        text: tokens[l]
      };
    }

    return tokens;
  }

  /**
   * Parse source into AST
   *
   * @param {*} parent
   * @param {string} state
   * @return {*}
   * @private
   */
  _parse(parent, state) {

    let token, text, keyword, argument, matches;

    while (this._pointer < this._tokens.length) {

      token = this._tokens[this._pointer];
      text = token.text;

      if (matches = text.trim().match(STATEMENT)) {
        keyword = matches[1];
        argument = matches[2].trim();
      } else {
        keyword = null;
      }

      const node = {
        line: token.line,
        file: this.file
      };

      switch (keyword) {

        // @include <path:expression>
        case 'include':

          node.type = INSTRUCTIONS.INCLUDE;
          node.value = argument;
          this._append(parent, node, state);

          break;

        // @set <variable:varname> <value:expression>
        case 'set':

          if (matches = argument.match(/^([_$A-Za-z][_A-Za-z0-9]*)(?:\s+|\s*=\s*)(.*)$/)) {
            node.type = INSTRUCTIONS.SET;
            node.variable = matches[1];
            node.value = matches[2];
          } else {
            throw new Error(`Syntax error in @set (${this.file}:${this._pointer})`);
          }

          this._append(parent, node, state);

          break;

        // @error <message:expression>
        case 'error':

          node.type = INSTRUCTIONS.ERROR;
          node.value = argument;
          this._append(parent, node, state);

          break;

        // @if <condition:expression>
        case 'if':

          node.type = INSTRUCTIONS.IF;
          node.test = argument;
          node.consequent = [];

          this._pointer++;
          this._parse(node, STATES.IF_CONSEQUENT);
          this._append(parent, node, state);

          break;

        case 'else':

          switch (state) {

            case STATES.IF_CONSEQUENT:
            case STATES.IF_ALTERNATE:
            case STATES.IF_ELSEIF:

              if (parent.alternate) {
                throw new Error(`Multiple @else statements are not allowed (${node.file}:${node.line})`);
              }

              parent.alternate = [];
              state = STATES.IF_ALTERNATE;
              break;

            default:
              throw new Error(`Unexpected @else (${node.file}:${node.line})`);
          }

          break;

        case 'elseif':

          switch (state) {

            case STATES.IF_CONSEQUENT:
            case STATES.IF_ELSEIF:

              // save as IF instruction
              node.type = INSTRUCTIONS.IF;
              node.test = argument;
              node.consequent = [];

              // add node to elseifs block
              if (!parent.elseifs) parent.elseifs = [];
              parent.elseifs.push(node);

              state = STATES.IF_ELSEIF;

              break;

            case STATES.IF_ALTERNATE:
              throw new Error(`@elseif after @else is not allowed (${node.file}:${node.line})`);

            default:
              throw new Error(`Unexpected @else (${node.file}:${node.line})`);
          }

          break;

        case 'endif':

          switch (state) {
            case STATES.IF_CONSEQUENT:
            case STATES.IF_ALTERNATE:
            case STATES.IF_ELSEIF:
              // we got here through recursion, get back
              return;

            default:
              throw new Error(`Unexpected @endif in (${node.file}:${node.line})`);
          }

          break;

        // source line
        case null:

          node.type = INSTRUCTIONS.SOURCE_FRAGMENT;
          node.value = this._tokens[this._pointer];
          this._append(parent, node, state);

          break;

        default:
          throw new Error(`Unsupported keyword "${keyword}" (${node.file}:${node.line})`);
      }

      this._pointer++;
    }

    // check final state
    switch (state) {
      case STATES.OK:
        break;

      case STATES.IF_ALTERNATE:
      case STATES.IF_CONSEQUENT:
      case STATES.IF_ELSEIF:
        throw new Error(`Unclosed @if statement (${this.file}:${this._tokens[this._tokens.length - 1].line})`);

      default:
        throw new Error(`Syntax error (${parent.file})`);
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
    }
  }

  get file() {
    return this._file || 'main';
  }

  set file(value) {
    this._file = value;
  }
}

module.exports = AstParser;
module.exports.INSTRUCTIONS = INSTRUCTIONS;
