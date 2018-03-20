'use strict';

const clone = require('clone');

/**
 * Merge context objects, e.g. local context with global
 * @param {...{}} - contexts
 */
module.exports = function() {
  const args = Array.prototype.slice.call(arguments);

  // clone target
  let target = args.shift();
  target = clone(target);
  args.unshift(target);

  return Object.assign.apply({}, args);
};
