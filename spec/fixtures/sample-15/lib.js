'use strict';

const assert = require('assert');

module.exports = {
  uinc: function(step) {
    if (step == null) {
      step = 1;
    }
    assert('uinc' in this);
    assert('udec' in this);
    assert('globals' in this)
    this.globals.a = this.globals.a + step;
    return `\t${this.globals.a} ${this.__FILE__} ${this.__LINE__}`;
  },

  udec: function(step) {
    if (step == null) {
      step = 1;
    }
    return this.uinc(-step);
  },
};
