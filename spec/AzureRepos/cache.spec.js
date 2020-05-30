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

require('jasmine-expect');

const fs = require('fs');
const Log = require('log');
const Builder = require('../../src/');

describe('FileCache', () => {
  let machine;

  beforeEach(() => {
    if (!process.env.SPEC_AZURE_REPOS_REPO_PATH) {
      fail('Some of the required environment variables are not set');
      return;
    }

    const builder = new Builder();
    builder.logger = new Log(process.env.SPEC_LOGLEVEL || 'error');
    builder.machine.readers.azureRepos.username = process.env.SPEC_AZURE_REPOS_USERNAME;
    builder.machine.readers.azureRepos.token = process.env.SPEC_AZURE_REPOS_TOKEN;
    machine = builder.machine;

    machine.fileCache.cacheDir = './test-cache';
  });

  afterEach(() => {
    if (!machine) {
      return;
    }

    if (fs.existsSync(machine.fileCache.cacheDir)) {
      machine.clearCache();
    }
  });

  it('should not read cached files when cache option is off', () => {
    let link = `git-azure-repos:${process.env.SPEC_AZURE_REPOS_REPO_PATH}/spec/fixtures/sample-11/LineBrakeSample.nut`;
    machine.useCache = false;
    machine.fileCache._cacheFile(link, 'cached');
    expect(machine.execute(`@include '${link}'`)).not.toEqual('cached');
  });

  it('should cache files in machine', () => {
    let link = `git-azure-repos:${process.env.SPEC_AZURE_REPOS_REPO_PATH}/spec/fixtures/sample-11/LineBrakeSample.nut`;
    machine.useCache = true;
    machine.execute(`@include '${link}'`);
    expect(machine.fileCache._findFile(link)).toBeTruthy();
  });

  it('should exclude remote files from cache', () => {
    machine.useCache = true;
    let linkName = `git-azure-repos:${process.env.SPEC_AZURE_REPOS_REPO_PATH}/spec/fixtures/sample-11/LineBrakeSample.nut`;
    expect(machine.fileCache._findFile(linkName)).toEqual(false);
    machine.excludeList = __dirname + '/../fixtures/config/exclude-all.exclude';
    machine.execute(`@include '${linkName}'`);
    expect(machine.fileCache._findFile(linkName)).toEqual(false);
  });

  it('should generate unique paths for different Azure Repos links', () => {
    const linksSet = new Set();
    const links = ['git-azure-repos:a/b/c.js',
                   'git-azure-repos:b/a/c.js',
                   'git-azure-repos:a/b/c.js@a',
                   'git-azure-repos:a/b/c.j@s',
                   'git-azure-repos:a/b/a-b-c.js',
                   'git-azure-repos:a/b-c_js/c.js',
                   'git-azure-repos:a/b/c_js.js',
                   'git-azure-repos:a/b/c/js'
                  ];
    links.forEach(link => {
      const path = machine.fileCache._getCachedPath(link);
      expect(linksSet.has(path)).toEqual(false);
      linksSet.add(path);
    });
  });
});
