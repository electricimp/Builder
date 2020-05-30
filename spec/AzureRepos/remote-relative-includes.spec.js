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

const eol = require('eol');
const Log = require('log');
const backslashToSlash = require('../backslashToSlash');
const Builder = require('../../src/');

// File inc-a.nut contains `@include "inc-b.nut"`
const azureReposPathA = `git-azure-repos:${process.env.SPEC_AZURE_REPOS_REPO_PATH}/spec/fixtures/sample-1/inc-a.nut`;

describe('remote-relative-includes', () => {
  let machine;

  beforeEach(function () {
    if (!process.env.SPEC_AZURE_REPOS_REPO_PATH) {
      fail('Some of the required environment variables are not set');
      return;
    }

    const builder = new Builder();
    builder.logger = new Log(process.env.SPEC_LOGLEVEL || 'error');
    builder.machine.readers.azureRepos.username = process.env.SPEC_AZURE_REPOS_USERNAME;
    builder.machine.readers.azureRepos.token = process.env.SPEC_AZURE_REPOS_TOKEN;
    machine = builder.machine;
  });

  it('fetch local include from Azure repos', () => {
    const fileNotFoundMessage = `Local file "inc-b.nut" not found (${azureReposPathA}:2)`;
    try {
      eol.lf(machine.execute(`@include once "${azureReposPathA}"`));
      fail();
    } catch (e) {
      expect(backslashToSlash(e.message)).toEqual(fileNotFoundMessage);
    }

    // Enable remote-relative-includes feature
    machine.remoteRelativeIncludes = true;
    const res = eol.lf(machine.execute(`@include once "${azureReposPathA}"`));
    expect(res).toEqual('// included file a\n// included file b\n');
  });
});
