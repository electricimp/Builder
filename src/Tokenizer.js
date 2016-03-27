/**
 * Tokenizer
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

// token types
const tokens = {
  INCLUDE: 'include',
  DEFINE: 'define',
  UNDEFINE: 'undefine',
  IF: 'if',
  ELSE: 'else',
  ELSEIF: 'elseif',
  ENDIF: 'endif',
  SOURCE_LINE: 'source_line'
};

class Tokenizer {

  /**
   * Tokenize a string
   * @param {string} content
   * @return {Array}
   */
  static tokenize(content) {
    const res = [];

    for (const line of content.toString().split(/\n|\r\n/)) {
      res.push(this.tokenizeLine(line));
    }

    return res;
  }

  /**
   * Tokenize a single line
   * @param {string} line
   * @return {{value, token}}
   */
  static tokenizeLine(line) {
    let m;

    if (m = line.trim().match(/^@(include|define|undefine|if|else|elseif|endif)\b(.*)$/)) {

      const keyword = m[1];
      const value = m[2].trim();

      switch (keyword) {

        // @include <source:expression>
        case 'include':
          return {token: tokens.INCLUDE, source: value};

        case 'define':

          // @define <variable:varname> <value:expression>
          if (m = value.match(/^([_A-Za-z][_A-Za-z0-9]*)\s+(.*)$/)) {
            return {token: tokens.DEFINE, varname: m[1], value: m[2]};
          } else {
            throw new Error('Syntax error in @define');
          }

          break;

      }

    } else {
      return {
        token: tokens.SOURCE_LINE,
        line
      };
    }
  }
}

module.exports = Tokenizer;
module.exports.tokens = tokens;
