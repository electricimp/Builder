/**
 * Abstract filer
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

const AbstractFilter = require('./AbstractFilter');

class EscapeFilter extends AbstractFilter {

  filter(input, args) {
    input = String(input);

    input = input.replace(/[\"\'\\\b\f\n\r\t]/g, (m) => {
      return {
        '"':'\\"',
        '\'':'\\\'',
        '\\':'\\\\',
        '\b':'\\b',
        '\f':'\\f',
        '\n':'\\n',
        '\r':'\\r',
        '\t':'\\t'
      }[m];
    });

    return input;
  }

  get name() {
    return 'escape';
  }
}

module.exports = EscapeFilter;
