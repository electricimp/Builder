// Copyright (c) 2016-2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

class AbstractFilter {
  /**
   * Apply filter
   * @param {[*]} args
   * @param {string} input
   */
  filter(input, args) {
    return String(input);
  }

  get name() {
    return 'abstract';
  }
}

module.exports = AbstractFilter;
