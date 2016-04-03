'use strict';

// instruction types
const INSTRUCTIONS = {
  IF: 'if',
  SET: 'set',
  ERROR: 'error',
  INCLUDE: 'include',
  SOURCE_FRAGMENT: 'source_fragment'
};

// states
const STATES = {
  OK: 'ok',
  IF_ELSEIF: 'if_elseif',
  IF_ALTERNATE: 'if_alternate',
  IF_CONSEQUENT: 'if_consequent'
};

// token types
const TOKENS = {
  IF: 'if',
  SET: 'set',
  ELSE: 'else',
  ENDIF: 'endif',
  ELSEIF: 'elseif',
  INCLUDE: 'include',
  SOURCE_FRAGMENT: 'source_fragment',
  INLINE_EXPRESSION: 'inline_expression'
};

// lines gobbling regex
const LINES = /(.*(?:\n|\r\n)?)/g;

// regex to detect if fragment is a statement
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

  /**
   * Tokenizes source
   *
   * @param {string} source
   * @return {Array}
   * @private
   */
  _tokenize(source) {
    let matches, type;

    const lines = source.match(LINES);
    const tokens = [];

    for (let i = 0; i < lines.length - 1 /* last line with the regex above is always empty */; i++) {

      const text = lines[i];
      const token = {line: 1 + i, text: text};

      if (matches = text.trim().match(STATEMENT)) {

        type = matches[1];
        token.args = [matches[2].trim()];

        switch (type) {

          case 'include':
            token.type = TOKENS.INCLUDE;
            break;

          case 'set':
            token.type = TOKENS.SET;
            break;

          case 'if':
            token.type = TOKENS.IF;
            break;

          case 'else':
            token.type = TOKENS.ELSE;
            break;

          case 'elseif':
            token.type = TOKENS.ELSEIF;
            break;

          case 'endif':
            token.type = TOKENS.ENDIF;
            break;

          case 'error':
            token.type = TOKENS.ERROR;
            break;

          default:
            throw new Error(`Unsupported keyword "${type}" (${this.file}:${token.line})`);
        }

      } else {
        // todo: detect inline expressions - @{}
        token.type = TOKENS.SOURCE_FRAGMENT;
        token.args = [text];
      }

      tokens.push(token);
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

    let token, matches;

    while (this._pointer < this._tokens.length) {

      token = this._tokens[this._pointer];

      const node = {
        line: token.line,
        file: this.file
      };

      switch (token.type) {

        // @include <path:expression>
        case TOKENS.INCLUDE:

          node.type = INSTRUCTIONS.INCLUDE;
          node.value = token.args[0];
          this._append(parent, node, state);

          break;

        // @set <variable:varname> <value:expression>
        case TOKENS.SET:

          if (matches = token.args[0].match(/^([_$A-Za-z][_A-Za-z0-9]*)(?:\s+|\s*=\s*)(.*)$/)) {
            node.type = INSTRUCTIONS.SET;
            node.variable = matches[1];
            node.value = matches[2];
          } else {
            throw new Error(`Syntax error in @set (${this.file}:${this._pointer})`);
          }

          this._append(parent, node, state);

          break;

        // @error <message:expression>
        case TOKENS.ERROR:

          node.type = INSTRUCTIONS.ERROR;
          node.value = token.args[0];
          this._append(parent, node, state);

          break;

        // @if <condition:expression>
        case TOKENS.IF:

          node.type = INSTRUCTIONS.IF;
          node.test = token.args[0];
          node.consequent = [];

          this._pointer++;
          this._parse(node, STATES.IF_CONSEQUENT);
          this._append(parent, node, state);

          break;

        case TOKENS.ELSE:

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

        case TOKENS.ELSEIF:

          switch (state) {

            case STATES.IF_CONSEQUENT:
            case STATES.IF_ELSEIF:

              // save as IF instruction
              node.type = INSTRUCTIONS.IF;
              node.test = token.args[0];
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

        case TOKENS.ENDIF:

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

        // source fragment
        case TOKENS.SOURCE_FRAGMENT:

          node.type = INSTRUCTIONS.SOURCE_FRAGMENT;
          node.value = token.args.join('');
          this._append(parent, node, state);

          break;

        default:
          throw new Error(`Unsupported token type "${token.type}" (${node.file}:${node.line})`);
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
