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

// require('jasmine-expect');

const eol = require('eol');
const Log = require('log');
const backslashToSlash = require('../backslashToSlash');
const Builder = require('../../src/');

// File inc-a.nut contains `@include "inc-b.nut"`
const bitbucketPathA = `bitbucket-server:${process.env.SPEC_BITBUCKET_SERVER_REPO_PATH}/spec/fixtures/sample-1/inc-a.nut`;

describe('remote-relative-includes', () => {
  let machine;

  beforeEach(function () {
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
  });

  it('fetch local include from Bitbucket server', () => {
    const fileNotFoundMessage = `Local file "inc-b.nut" not found (${bitbucketPathA}:2)`;
    try {
      eol.lf(machine.execute(`@include once "${bitbucketPathA}"`));
      fail();
    } catch (e) {
      expect(backslashToSlash(e.message)).toEqual(fileNotFoundMessage);
    }

    // Enable remote-relative-includes feature
    machine.remoteRelativeIncludes = true;
    const res = eol.lf(machine.execute(`@include once "${bitbucketPathA}"`));
    expect(res).toEqual('// included file a\n// included file b\n');
  });
});
