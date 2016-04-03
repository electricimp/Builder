'use strict';

// instruction types
const INSTRUCTIONS = {
  IF: 'if',
  SET: 'set',
  ERROR: 'error',
  INCLUDE: 'include',
  SOURCE_LINE: 'source_line'
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

  parse(source) {
    this._pointer = 0; // line pointer
    this._lines = source.split(/\n|\r\n/);
    return this._parse([], STATES.OK);
  }

  _parse(parent, state) {

    let line, matches, keyword, argument, skip;

    while (this._pointer < this._lines.length) {

      // do not append current instruction to base block
      skip = false;

      line = this._lines[this._pointer];

      if (matches = line.trim().match(STATEMENT)) {
        keyword = matches[1];
        argument = matches[2].trim();
      } else {
        keyword = null;
      }

      const node = {
        line: 1 + this._pointer,
        file: this.file
      };

      switch (keyword) {

        // @include <path:expression>
        case 'include':

          node.type = INSTRUCTIONS.INCLUDE;
          node.value = argument;

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

          break;

        // @error <message:expression>
        case 'error':

          node.type = INSTRUCTIONS.ERROR;
          node.value = argument;

          break;

        // @if <condition:expression>
        case 'if':

          node.type = INSTRUCTIONS.IF;
          node.test = argument;
          node.consequent = [];

          this._pointer++;
          this._parse(node, STATES.IF_CONSEQUENT);

          break;

        case 'else':

          switch (state) {

            case STATES.IF_CONSEQUENT:
            case STATES.IF_ALTERNATE:
            case STATES.IF_ELSEIF:

              if (parent.alternate) {
                throw new Error(`Multiple @else statements are not allowed (${node.file}:${node.line})`);
              }

              skip = true;
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
              skip = true;

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
              return;

            default:
              throw new Error(`Unexpected @endif in (${node.file}:${node.line})`);
          }

          break;

        // source line
        case null:
          node.type = INSTRUCTIONS.SOURCE_LINE;
          node.value = this._lines[this._pointer];
          break;

        default:
          throw new Error(`Unsupported keyword "${keyword}" (${node.file}:${node.line})`);
      }

      // append node

      if (!skip) {

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

          default:
            throw new Error(`Unknown state "${state}"`);
        }

      }

      this._pointer++;
    }

    return parent;
  }

  get file() {
    return this._file || 'main';
  }

  set file(value) {
    this._file = value;
  }
}

module.exports = AstParser;
module.exports.TOKENS = INSTRUCTIONS;
