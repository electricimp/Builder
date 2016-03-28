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

    for (let l = 0; l < lines.length; l++) {
      const line = lines[l];
      res.push(this._parseLine(line, l + 1));
    }

    return res;
  }

  /**
   * Tokenize a single line
   * @param {string} line
   * @param {number} lineNumber
   * @return {{value, token}}
   * @private
   */
  _parseLine(line, lineNumber) {
    let m;

    const r = {
      _line: lineNumber, // line #
      _source: this.sourceName // source name
    };

    if (m = line.trim().match(/^@(include|set|if|else|elseif|endif|error)\b(.*)$/)) {

      const keyword = m[1];
      const value = m[2].trim();

      switch (keyword) {

        // @include <path:expression>
        case 'include':

          r.token = tokens.INCLUDE;

          // remove bounding qouotes
          if (value.length >= 2 && value.charAt(0) === '"' && value.charAt(value.length - 1) === value.charAt(0)) {
            r.path = value.substr(1, value.length - 2);
          } else {
            r.path = value;
          }

          break;

        // @set <variable:varname> <value:expression>
        case 'set':

          if (m = value.match(/^([_A-Za-z][_A-Za-z0-9]*)\s+(.*)$/)) {
            r.token = tokens.SET;
            r.variable = m[1];
            r.value = m[2];
          } else {
            throw new Error('Syntax error in @set (' + this.sourceName + ':' + lineNumber + ')');
          }

          break;

        // @if <condition:expression>
        case 'if':

          r.token = tokens.IF;
          r.condition = value;

          break;

        // @elseif <condition:expression>
        case 'elseif':

          r.token = tokens.ELSEIF;
          r.condition = value;

          break;

        // @else
        case 'else':

          if (value.length > 0) {
            throw new Error('Syntax error in @else (' + this.sourceName + ':' + lineNumber + ')');
          }

          r.token = tokens.ELSE;

          break;

        // @endif
        case 'endif':

          if (value.length > 0) {
            throw new Error('Syntax error in @endif (' + this.sourceName + ':' + lineNumber + ')');
          }

          r.token = tokens.ENDIF;

          break;

        // @error <message:expression>
        case 'error':

          r.token = tokens.ERROR;
          r.message = value;

          break;

      }

    } else {
      r.token = tokens.SOURCE_LINE;
      r.line = line;
    }

    return r;
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
