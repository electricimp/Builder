/**
 * GithubReader spec
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

const fs = require('fs');
const Log = require('log');
const GithubReader = require('../src/Readers/GithubReader');
const jasmineDiffMatchers = require('jasmine-diff-matchers');
const AbstractReader = require('../src/Readers/AbstractReader');

describe('GithubReader', () => {

  let reader;

  beforeEach(function () {
    reader = new GithubReader();
    reader.timeout = 30000; // 30s

    // @see https://www.npmjs.com/package/log#log-levels
    reader.logger = new Log(process.env.SPEC_LOGLEVEL || 'error');

    // show string diffs
    jasmine.addMatchers(jasmineDiffMatchers.diffChars);
  });

  it('should read sample#1 from GH', () => {
    const remote = reader.read('github.com/electricimp/Promise/Promise.class.nut');
    console.log(remote);
  });

});
