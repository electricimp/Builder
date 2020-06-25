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

const fs = require('fs');
const Log = require('log');
const eol = require('eol');
const path = require('path');
const GitLocalReader = require('../../src/Readers/GitLocalReader');

describe('GitLocalReader', () => {
  let reader;

  beforeEach(function() {
    if (!process.env.SPEC_GIT_LOCAL_REPO_PATH) {
      fail('Some of the required environment variables are not set');
      return;
    }

    reader = new GitLocalReader();

    // @see https://www.npmjs.com/package/log#log-levels
    reader.logger = new Log(process.env.SPEC_LOGLEVEL || 'error');
  });

  it('should read sample#1 from local git repo', () => {
    const expectedContent = eol.lf(fs.readFileSync(__dirname + '/../fixtures/sample-1/input.nut', 'utf-8'));
    let resultContent;

    resultContent = reader.read(`git-local:${process.env.SPEC_GIT_LOCAL_REPO_PATH}/spec/fixtures/sample-1/input.nut`);
    expect(resultContent).toEqual(expectedContent);

    resultContent = reader.read(`git-local:${process.env.SPEC_GIT_LOCAL_REPO_PATH}/./spec/../spec/fixtures/sample-1/input.nut`);
    expect(resultContent).toEqual(expectedContent);

    resultContent = reader.read(`git-local:${process.env.SPEC_GIT_LOCAL_REPO_PATH}/./spec/../spec/fixtures/sample-1/input.nut@master`);
    expect(resultContent).toEqual(expectedContent);
  });

  it('should read sample#1 from local git repo with refs', () => {
    const expectedContent = eol.lf(fs.readFileSync(__dirname + '/../fixtures/sample-1/input.nut', 'utf-8'));
    let resultContent;

    resultContent = reader.read(`git-local:${process.env.SPEC_GIT_LOCAL_REPO_PATH}/spec/fixtures/sample-1/input.nut@master`);
    expect(resultContent).toEqual(expectedContent);

    resultContent = reader.read(`git-local:${process.env.SPEC_GIT_LOCAL_REPO_PATH}/spec/fixtures/sample-1/input.nut@v0.1.0`);
    expect(resultContent).toEqual(expectedContent);

    resultContent = reader.read(`git-local:${process.env.SPEC_GIT_LOCAL_REPO_PATH}/spec/fixtures/sample-1/input.nut@20454c4dcb9621252d248d8a833ceb1ca79c3730`);
    expect(resultContent).toEqual(expectedContent);
  });
});
