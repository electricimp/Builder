// MIT License
//
// Copyright 2020 Electric Imp
//
// SPDX-License-Identifier: MIT
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
// EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
// OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

'use strict';

const Builder = require('../../src');
const backslashToSlash = require('../backslashToSlash');
const Log = require('log');
const path = require('path');
const fs = require('fs');

const LOCAL_REPO_NOT_DEFINED_MESSAGE = "SPEC_GIT_LOCAL_REPO_PATH is not defined. Test will be skipped";

describe('__PATH__ variable - ', () => {

  let builder;
  const contextPath = path.resolve(__dirname + "/../fixtures/lib/").replace(/\\/g, '/');

  beforeEach(() => {
    builder = new Builder();
    builder.machine.path = contextPath;
    builder.machine.readers.github.username = process.env.SPEC_GITHUB_USERNAME;
    builder.machine.readers.github.token = process.env.SPEC_GITHUB_PASSWORD || process.env.SPEC_GITHUB_TOKEN;
    builder.logger = new Log(process.env.SPEC_LOGLEVEL || 'error');
  });

  it('__PATH__ should be a local path', () => {
    let output = builder.machine.execute(`@include "${backslashToSlash(__dirname)}/../fixtures/lib/path.builder"`);
    expect(output).toContain(contextPath + "#path.builder@1");
  });

  it('__PATH__ should be a git-local path', () => {
    if (process.env.SPEC_GIT_LOCAL_REPO_PATH != undefined) {
      let output = builder.machine.execute(`@include "git-local:${process.env.SPEC_GIT_LOCAL_REPO_PATH}/spec/fixtures/lib/path.builder@develop"`);
      expect(output).toContain("git-local:" + backslashToSlash(process.env.SPEC_GIT_LOCAL_REPO_PATH) + "/spec/fixtures/lib#path.builder@1");
    } else {
      console.log(LOCAL_REPO_NOT_DEFINED_MESSAGE);
    }
  });

  it('__PATH__ should be a remote repository path', () => {
    let output = builder.machine.execute(`@include "github:electricimp/Builder/spec/fixtures/lib/path.builder@develop"`);
    expect(output).toContain('github:electricimp/Builder/spec/fixtures/lib#path.builder@1\n');
  });

  it('__PATH__ should be a web link', () => {
    let output = builder.machine.execute(`@include "https://raw.githubusercontent.com/electricimp/Builder/develop/spec/fixtures/lib/path.builder"`);
    expect(output).toContain('https://raw.githubusercontent.com/electricimp/Builder/develop/spec/fixtures/lib#path.builder@1\n');
  });
});
