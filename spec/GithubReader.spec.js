// Copyright (c) 2016-2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

const fs = require('fs');
const Log = require('log');
const eol = require('eol');
const GithubReader = require('../src/Readers/GithubReader');
const jasmineDiffMatchers = require('jasmine-diff-matchers');

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
    let remote;
    const local = eol.lf(fs.readFileSync(__dirname + '/fixtures/sample-1/input.nut', 'utf-8'));
    reader.username = process.env.SPEC_GITHUB_USERNAME;
    reader.password = process.env.SPEC_GITHUB_PASSWORD || process.env.SPEC_GITHUB_TOKEN;

    remote = reader.read('github:electricimp/Builder/spec/fixtures/sample-1/input.nut@master');
    expect(remote).toEqual(local);

    remote = reader.read('github.com:electricimp/Builder/spec/fixtures/sample-1/input.nut');
    expect(remote).toEqual(local);

    remote = reader.read('github.com/electricimp/Builder/spec/fixtures/sample-1/input.nut');
    expect(remote).toEqual(local);
  });

});
