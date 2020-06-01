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
const AzureReposReader = require('../../src/Readers/AzureReposReader');

describe('AzureReposReader', () => {
  let reader;

  beforeEach(function() {
    if (!process.env.SPEC_AZURE_REPOS_REPO_PATH) {
      fail('Some of the required environment variables are not set');
      return;
    }

    reader = new AzureReposReader();

    // @see https://www.npmjs.com/package/log#log-levels
    reader.logger = new Log(process.env.SPEC_LOGLEVEL || 'error');
    reader.username = process.env.SPEC_AZURE_REPOS_USERNAME;
    reader.token = process.env.SPEC_AZURE_REPOS_TOKEN;
  });

  it('should read sample#1 from Azure Repos', () => {
    let remote;
    const local = eol.lf(fs.readFileSync(__dirname + '/../fixtures/sample-1/input.nut', 'utf-8'));

    remote = reader.read(`git-azure-repos:${process.env.SPEC_AZURE_REPOS_REPO_PATH}/spec/fixtures/sample-1/input.nut`);
    expect(remote).toEqual(local);

    remote = reader.read(`git-azure-repos:${process.env.SPEC_AZURE_REPOS_REPO_PATH}/spec/fixtures/sample-1/input.nut@master`);
    expect(remote).toEqual(local);

    remote = reader.read(`git-azure-repos:${process.env.SPEC_AZURE_REPOS_REPO_PATH}/./spec/../spec/fixtures/sample-1/input.nut`);
    expect(remote).toEqual(local);

    remote = reader.read(`git-azure-repos:${process.env.SPEC_AZURE_REPOS_REPO_PATH}/./spec/../spec/fixtures/sample-1/input.nut@master`);
    expect(remote).toEqual(local);
  });
});
