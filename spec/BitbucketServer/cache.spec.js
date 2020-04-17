// MIT License
//
// Copyright 2019 Electric Imp
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
    if (!(process.env.SPEC_BITBUCKET_SERVER_ADDRESS && process.env.SPEC_BITBUCKET_SERVER_REPO_PATH)) {
      fail('Some of the required environment variables are not set');
      return;
    }

    const builder = new Builder();
    builder.logger = new Log(process.env.SPEC_LOGLEVEL || 'error');
    builder.machine.readers.bitbucketSrv.serverAddr = process.env.SPEC_BITBUCKET_SERVER_ADDRESS;
    builder.machine.readers.bitbucketSrv.username = process.env.SPEC_BITBUCKET_SERVER_USERNAME;
    builder.machine.readers.bitbucketSrv.token = process.env.SPEC_BITBUCKET_SERVER_PASSWORD || process.env.SPEC_BITBUCKET_SERVER_TOKEN;
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
    let link = `bitbucket-server:${process.env.SPEC_BITBUCKET_SERVER_REPO_PATH}/spec/fixtures/sample-11/LineBrakeSample.nut`;
    machine.useCache = false;
    machine.fileCache._cacheFile(link, 'cached');
    expect(machine.execute(`@include '${link}'`)).not.toEqual('cached');
  });

  it('should cache files in machine', () => {
    let link = `bitbucket-server:${process.env.SPEC_BITBUCKET_SERVER_REPO_PATH}/spec/fixtures/sample-11/LineBrakeSample.nut`;
    machine.useCache = true;
    machine.execute(`@include '${link}'`);
    expect(machine.fileCache._findFile(link)).toBeTruthy();
  });

  it('should exclude remote files from cache', () => {
    machine.useCache = true;
    let linkName = `bitbucket-server:${process.env.SPEC_BITBUCKET_SERVER_REPO_PATH}/spec/fixtures/sample-11/LineBrakeSample.nut`;
    expect(machine.fileCache._findFile(linkName)).toEqual(false);
    machine.excludeList = __dirname + '/../fixtures/config/exclude-all.exclude';
    machine.execute(`@include '${linkName}'`);
    expect(machine.fileCache._findFile(linkName)).toEqual(false);
  });

  it('should generate unique paths for different bitbucket-server links', () => {
    const linksSet = new Set();
    const links = ['bitbucket-server:a/b/c.js',
                   'bitbucket-server:b/a/c.js',
                   'bitbucket-server:a/b/c.js@a',
                   'bitbucket-server:a/b/c.j@s',
                   'bitbucket-server:a/b/a-b-c.js',
                   'bitbucket-server:a/b-c_js/c.js',
                   'bitbucket-server:a/b/c_js.js',
                   'bitbucket-server:a/b/c/js'
                  ];
    links.forEach(link => {
      const path = machine.fileCache._getCachedPath(link);
      expect(linksSet.has(path)).toEqual(false);
      linksSet.add(path);
    });
  });
});
