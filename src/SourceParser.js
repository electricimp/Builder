/**
 * Source parser
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

// token types
const tokens = {
  INCLUDE: 'include',
  SET: 'set',
  IF: 'if',
  ELSE: 'else',
  ELSEIF: 'elseif',
  ENDIF: 'endif',
  ERROR: 'error',
  SOURCE_LINE: 'source_line'
};

class SourceParser {

  /**
   * Tokenize a string
   * @param {string} content
   * @return {Array}
   */
  parse(content) {
    const res = [];
    const lines = content.toString().split(/\n|\r\n/);

    for (const l in lines) {
      const line = lines[l];
      res.push(this.parseLine(line, l + 1));
    }

    return res;
  }

  /**
   * Tokenize a single line
   * @param {string} line
   * @param {number} lineNumber
   * @return {{value, token}}
   */
  parseLine(line, lineNumber) {
    let m;

    if (m = line.trim().match(/^@(include|set|if|else|elseif|endif|error)\b(.*)$/)) {

      const keyword = m[1];
      const value = m[2].trim();

      switch (keyword) {

        // @include <source:expression>
        case 'include':
          return {token: tokens.INCLUDE, source: value};

        // @set <variable:varname> <value:expression>
        case 'set':

          if (m = value.match(/^([_A-Za-z][_A-Za-z0-9]*)\s+(.*)$/)) {
            return {token: tokens.SET, variable: m[1], value: m[2]};
          } else {
            throw new Error('Syntax error in @set (' + this.sourceName + ':' + lineNumber + ')');
          }

          break;

        // @if <condition:expression>
        case 'if':
          return {token: tokens.IF, condition: value};

        // @elseif <condition:expression>
        case 'elseif':
          return {token: tokens.ELSEIF, condition: value};

        // @else
        case 'else':
          if (value.length > 0) {
            throw new Error('Syntax error in @else (' + this.sourceName + ':' + lineNumber + ')');
          }

          return {token: tokens.ELSE};

        // @endif
        case 'endif':
          if (value.length > 0) {
            throw new Error('Syntax error in @endif (' + this.sourceName + ':' + lineNumber + ')');
          }

          return {token: tokens.ENDIF};

        // @error <message:expression>
        case 'error':
          return {token: tokens.ERROR, message: value};

      }

    } else {
      return {
        token: tokens.SOURCE_LINE,
        line
      };
    }
  }

  // <editor-fold desc="Accessors" defaultstate="collapsed">

  get sourceName() {
    return this._sourceName || 'main';
  }

  set sourceName(value) {
    this._sourceName = value;
  }

  // </editor-fold>
}

module.exports = SourceParser;
module.exports.tokens = tokens;
