'use strict'
module.exports = {
  upper: function(s) {
    return s.toUpperCase();
  },
  repeat: function(s, count) {
    return s.repeat(count);
  },
  split: function(s, seperator, index) {
    return s.split(seperator)[index];
  },
  length: function(s) {
    return s.length;
  },
};
