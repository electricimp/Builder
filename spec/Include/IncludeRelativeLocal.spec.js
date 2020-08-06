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

describe('Builder is called for file in included directory - ', () => {

  let builder;
  const contextPath = path.resolve(__dirname + "/../fixtures/include/sample-1/").replace(/\\/g, '/');

  beforeEach(() => {
    builder = new Builder();
    builder.machine.path = contextPath;
    builder.machine.readers.file.runDir = contextPath;
    builder.machine.readers.file.inputFileDir = path.join(contextPath + '/dirZ');
    builder.logger = new Log(process.env.SPEC_LOGLEVEL || 'error');
  });

  it('should search Y file in directory where X file located', () => {
    let output = builder.machine.execute(`@include "dirZ/file_case1.nut"`);
    expect(output).toContain('// y.nut (case 1)\n');
  });

  it('should search Y file in directory where processing file located', () => {
    let output = builder.machine.execute(`@include "dirZ/file_case2.nut"`);
    expect(output).toContain('// y.nut (case 2)\n');
  });

  it('should search Y file in directory where builder called', () => {
    let output = builder.machine.execute(`@include "dirZ/file_case3.nut"`);
    expect(output).toContain('// y.nut (case 3)\n');
  });

  it('file not found', () => {
    const filePath = path.join(contextPath, 'dirX/x_case4.nut').replace(/\\/g, '/');
    const fileNotFoundMessage = `Local file "dirD/y4.nut" not found (${filePath}:1)`;
    try {
      builder.machine.execute(`@include "dirZ/file_case4.nut"`);
      fail();
    } catch (e) {
      expect(backslashToSlash(e.message)).toEqual(fileNotFoundMessage);
    }
  });
});

describe('Builder is called for file in current directory - ', () => {

  let builder;
  const contextPath = path.resolve(__dirname + "/../fixtures/include/sample-1/dirZ").replace(/\\/g, '/');

  beforeEach(() => {
    builder = new Builder();
    builder.machine.path = contextPath;
    builder.machine.readers.file.runDir = contextPath;
    builder.machine.readers.file.inputFileDir = path.join(contextPath);
    builder.logger = new Log(process.env.SPEC_LOGLEVEL || 'error');
  });

  it('should search Y file in directory where X file located', () => {
    let output = builder.machine.execute(`@include "file_case1.nut"`);
    expect(output).toContain('// y.nut (case 1)\n');
  });

  it('should search Y file in directory where processing file located', () => {
    let output = builder.machine.execute(`@include "file_case2.nut"`);
    expect(output).toContain('// y.nut (case 2)\n');
  });

  it('should search Y file in directory where builder called', () => {
    const filePath = path.join(contextPath, '/../dirX/x_case3.nut').replace(/\\/g, '/');
    const fileNotFoundMessage = `Local file "dirD/y3.nut" not found (${filePath}:1)`;
    try {
      builder.machine.execute(`@include "file_case3.nut"`);
      fail();
    } catch (e) {
      expect(backslashToSlash(e.message)).toEqual(fileNotFoundMessage);
    }
  });
});

describe('Builder is called for file in deep included directory - ', () => {

  let builder;
  const contextPath = path.resolve(__dirname + "/../fixtures/include/").replace(/\\/g, '/');

  beforeEach(() => {
    builder = new Builder();
    builder.machine.path = contextPath;
    builder.machine.readers.file.runDir = contextPath;
    builder.machine.readers.file.inputFileDir = path.join(contextPath + '/sample-1/dirZ');
    builder.logger = new Log(process.env.SPEC_LOGLEVEL || 'error');
  });

  it('should search Y file in directory where X file located', () => {
    let output = builder.machine.execute(`@include "sample-1/dirZ/file_case1.nut"`);
    expect(output).toContain('// y.nut (case 1)\n');
  });

  it('should search Y file in directory where processing file located', () => {
    let output = builder.machine.execute(`@include "sample-1/dirZ/file_case2.nut"`);
    expect(output).toContain('// y.nut (case 2)\n');
  });

  it('file not found', () => {
    const filePath = path.join(contextPath, 'sample-1/dirX/x_case3.nut').replace(/\\/g, '/');
    const fileNotFoundMessage = `Local file "dirD/y3.nut" not found (${filePath}:1)`;
    try {
      builder.machine.execute(`@include "sample-1/dirZ/file_case3.nut"`);
      fail();
    } catch (e) {
      expect(backslashToSlash(e.message)).toEqual(fileNotFoundMessage);
    }
  });

  it('should search Y file in directory where builder called', () => {
    let output = builder.machine.execute(`@include "sample-1/dirZ/file_case4.nut"`);
    expect(output).toContain('// y.nut (case 4)\n');
  });
});
