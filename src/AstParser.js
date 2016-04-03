'use strict';

// token types
const TOKENS = {
  INCLUDE: 'include',
  SET: 'set',
  IF: 'if',
  ELSE: 'else',
  ELSEIF: 'elseif',
  ENDIF: 'endif',
  ERROR: 'error',
  SOURCE_LINE: 'source_line'
};

const STATES = {
  OK: 'ok',
  IF_CONSEQUENT: 'if_consequent',
  IF_ALTERNATE: 'if_alternate',
  IF_ELSEIF: 'if_elseif'
};

// regex to detect if a like is a statement
const STATEMENT = /^\s*@(include|set|if|else|elseif|endif|error)\b(.*)$/;

class AstParser {

  parse(source) {
    this._pointer = 0; // line pointer
    this._lines = source.split(/\n|\r\n/);
    this._root = []; // root base block
    this._parse(this._root, 'ok');
    return this._root;
  }

  _parse(block, state) {

    let m, keyword, argument;

    while (this._pointer < this._lines.length) {

      if (m = this._lines[this._pointer].trim().match(STATEMENT)) {
        keyword = m[1];
        argument = m[2].trim();
      } else {
        keyword = null;
      }

      const node = {
        _line: 1 + this._pointer,
        _file: this.file
      };

      // switch (state) {
      //   case states.OK:
      //
      //     switch (keyword) {
      //       case null:
      //         token.type = tokens.SOURCE_LINE;
      //         block.push(token);
      //         break;
      //
      //       default:
      //         throw new Error()
      //     }
      //
      //     break;
      //
      //   case states.IF_THEN:
      //     break;
      //
      //   default:
      //     throw new Error(`Unknown state ${state}`);
      // }

      switch (keyword) {

        // @include <path:expression>
        case 'include':

          node.token = TOKENS.INCLUDE;
          node.value = argument;

          break;

        // @set <variable:varname> <value:expression>
        case 'set':

          if (m = argument.match(/^([_$A-Za-z][_A-Za-z0-9]*)\s+(.*)$/)) {
            node.token = TOKENS.SET;
            node.variable = m[1];
            node.value = m[2];
          } else {
            throw new Error(`Syntax error in @set  at ${this.file}:${this._pointer}`);
          }

          break;

        // @error <message:expression>
        case 'error':

          node.token = TOKENS.ERROR;
          node.value = argument;

          break;

        // @if <condition:expression>
        case 'if':

          node.token = TOKENS.IF;
          node.test = argument;
          node.consequent = [];
          node.alternate = [];
          node.elseifs = [];

          this._pointer++;
          this._parse(node.consequent, STATES.IF_CONSEQUENT);

          break;

        case 'endif':

          switch (state) {
            case STATES.IF_CONSEQUENT:
            case STATES.IF_ALTERNATE:
            case STATES.IF_ELSEIF:
              return block;

            default:
              throw new Error(`Unexpected @endif in in ${node._file}:${node._line}`);
          }

          break;

        case null:
          node.token = TOKENS.SOURCE_LINE;
          node.value = this._lines[this._pointer];
          break;

        default:
          throw new Error(`Unsupported keyword "${keyword}" in ${node._file}:${node._line}`);
      }

      block.push(node);
      this._pointer++;
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
module.exports.TOKENS = TOKENS;
