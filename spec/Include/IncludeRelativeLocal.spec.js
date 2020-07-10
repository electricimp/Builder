// Copyright (c) 2016-2020 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

const Builder = require('../../src');
const backslashToSlash = require('../backslashToSlash');
const Log = require('log');
const path = require('path');

describe('Builder is called for file in included directory', () => {

  let builder;
  const contextPath = path.resolve(__dirname + "/../fixtures/include/sample-1/");

  beforeEach(() => {
    builder = new Builder();
    builder.machine.path = contextPath;
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
    const filePath = path.join(contextPath, 'dirX/x_case4.nut');
    const fileNotFoundMessage = `Local file "dirD/y4.nut" not found (${filePath}:1)`;
    try {
      builder.machine.execute(`@include "dirZ/file_case4.nut"`);
      fail();
    } catch (e) {
      expect(backslashToSlash(e.message)).toEqual(fileNotFoundMessage);
    }
  });
});

describe('Builder is called for file in current directory', () => {

  let builder;
  const contextPath = path.resolve(__dirname + "/../fixtures/include/sample-1/dirZ");

  beforeEach(() => {
    builder = new Builder();
    builder.machine.path = contextPath;
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
    const filePath = path.join(contextPath, '/../dirX/x_case3.nut');
    const fileNotFoundMessage = `Local file "dirD/y3.nut" not found (${filePath}:1)`;
    try {
      builder.machine.execute(`@include "file_case3.nut"`);
      fail();
    } catch (e) {
      expect(backslashToSlash(e.message)).toEqual(fileNotFoundMessage);
    }
  });
});

describe('Builder is called for file in deep included directory', () => {

  let builder;
  const contextPath = path.resolve(__dirname + "/../fixtures/include/");

  beforeEach(() => {
    builder = new Builder();
    builder.machine.path = contextPath;
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
    const filePath = path.join(contextPath, 'sample-1/dirX/x_case3.nut');
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
