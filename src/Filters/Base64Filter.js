// Copyright (c) 2016-2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

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
