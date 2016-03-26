/**
 * Debug mixin
 *
 * Adds:
 *  - "debug" property
 *  - "_debug()"
 *
 *  @author Mikhail Yurasov <mikhail@electricimp.com>
 *  @version 1.0.0
 */

'use strict';

const c = require('colors');

function DebugMixin() {

  this.__defineGetter__('debug', () => {
    return !!this.__debug;
  });

  this.__defineSetter__('debug', (value) => {
    this.__debug = !!value;
  });

  /**
   * Debug print
   * @param {*} ...objects
   * @protected
   */
  this._debug = function () {
    if (this.debug) {
      const args = Array.prototype.slice.call(arguments);
      args.unshift(c.green('[debug:' + this.constructor.name + ']'));
      console.log.apply(this, args);
    }
  };

}

module.exports = DebugMixin;
