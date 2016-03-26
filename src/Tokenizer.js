/**
 * Tokenizer
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

const TOKENS = {
  T_INCLUDE: 'include',
  T_DEFINE: 'define',
  T_UNDEFINE: 'undefine',
  T_IF: 'if',
  T_ELSE: 'else',
  T_ELSEIF: 'elseif',
  T_ENDIF: 'endif',
  T_SOURCE_LINE: 'source_line'
};

const REGEXPS = {
  [TOKENS.T_INCLUDE]: /^@include +(.*)$/,
  [TOKENS.T_DEFINE]: /^@define +(.*)$/,
  [TOKENS.T_UNDEFINE]: /^@undefine +(.*)$/,
  [TOKENS.T_IF]: /^@if +(.*)$/,
  [TOKENS.ELSE]: /^@else *$/,
  [TOKENS.ELSEIF]: /^@elseif +(.*)$/,
  [TOKENS.T_ENDIF]: /^@endif *$/
};

class Tokenizer {
  static tokenizeLine(line) {
    const trimmedLine = line.trim();

    // iterate through regeps
    for (const token in REGEXPS) {
      let m;
      const r = REGEXPS[token];
      if (m = trimmedLine.match(r)) {
        return {
          token: token,
          value: m[1]
        };
      }
    }

    return {
      token: TOKENS.T_SOURCE_LINE,
      value: line
    };
  }
}

module.exports = Tokenizer;
module.exports.TOKENS = TOKENS;
