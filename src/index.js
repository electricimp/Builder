/**
 * Bundler
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

const fs = require('fs');
const c = require('colors');
const Errors = require('./Errors');
const DebugMixin = require('./lib/DebugMixin');

class ImpBundler {

  constructor() {
    DebugMixin.call(this);
  }

  bundle(sourceFile) {

    console.log("aaa");

  }
}

module.exports = ImpBundler;
module.exports.Errors = Errors;
