// Copyright (c) 2016-2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

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
