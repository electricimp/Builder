/**
 * Abstract filer
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

const AbstractFilter = require('./AbstractFilter');

class Base64Filter extends AbstractFilter {

  filter(input, args) {
    input = String(input);
    input = Buffer(input).toString('base64');
    return input;
  }

  get name() {
    return 'base64';
  }
}

module.exports = Base64Filter;
