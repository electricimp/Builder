// Copyright (c) 2016-2020 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

const Builder = require('../../src');
const backslashToSlash = require('../backslashToSlash');
const Log = require('log');
const path = require('path');
const fs = require('fs');

describe('__PATH__ variable', () => {

  let builder;
  const contextPath = path.resolve(__dirname + "/../fixtures/lib/").replace(/\\/g, '/');

  beforeEach(() => {
    builder = new Builder();
    builder.machine.path = contextPath;
    builder.logger = new Log(process.env.SPEC_LOGLEVEL || 'error');
  });

  it('__PATH__ should be a local path', () => {
    let output = builder.machine.execute(`@include "${backslashToSlash(__dirname)}/../fixtures/lib/path.builder"`);
    expect(output).toContain(contextPath + "#path.builder@1");
  });

  it('__PATH__ should be a git-local path', () => {
    let output = builder.machine.execute(`@include "git-local:${process.env.SPEC_GIT_LOCAL_REPO_PATH}/spec/fixtures/lib/path.builder@feature/ADO-310-includes-enhancement"`);
    expect(output).toContain("git-local:" + process.env.SPEC_GIT_LOCAL_REPO_PATH + "/spec/fixtures/lib#path.builder@1");
  });
  
  it('__PATH__ should be a remote repository path', () => {
    let output = builder.machine.execute(`@include "github:YaroslavYaroslavtsev/Builder/spec/fixtures/lib/path.builder@feature/ADO-310-includes-enhancement"`);
    expect(output).toContain('github:YaroslavYaroslavtsev/Builder/spec/fixtures/lib#path.builder@1\n');
  });

  it('__PATH__ should be a web link', () => {
    let output = builder.machine.execute(`@include "https://raw.githubusercontent.com/YaroslavYaroslavtsev/Builder/feature/ADO-310-includes-enhancement/spec/fixtures/lib/path.builder"`);
    expect(output).toContain('https://raw.githubusercontent.com/YaroslavYaroslavtsev/Builder/feature/ADO-310-includes-enhancement/spec/fixtures/lib#path.builder@1\n');
  });
});
