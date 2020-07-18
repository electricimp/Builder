// Copyright (c) 2016-2020 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

const Builder = require('../../src');
const Log = require('log');
const path = require('path');
const fs = require('fs');

describe('Builder is called for file in included directory', () => {

  let builder;
  const contextPath = path.resolve(__dirname + "/../fixtures/include/sample-3/").replace(/\\/g, '/');

  beforeEach(() => {
    builder = new Builder();
    builder.machine.path = contextPath;
    builder.logger = new Log(process.env.SPEC_LOGLEVEL || 'error');
  });

  it('__PATH__ should be a local path', () => {
    let output = builder.machine.execute(`@include "file_case1.nut"`);
    expect(output).toContain(contextPath);
  });

  it('__PATH__ should be a remote repository path', () => {
    let output = builder.machine.execute(`@include "file_case2.nut"`);
    expect(output).toContain('github:EatonGMBD/Builder/spec/fixtures/include/sample-3\n');
  });

  it('__PATH__ should be a web link', () => {
    let output = builder.machine.execute(`@include "file_case3.nut"`);
    expect(output).toContain('https://raw.githubusercontent.com/EatonGMBD/Builder/feature/ADO-310-includes-enhancement/spec/fixtures/include/sample-3\n');
  });
});
