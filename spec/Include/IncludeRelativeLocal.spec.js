// Copyright (c) 2016-2020 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

const Builder = require('../../src');
const backslashToSlash = require('../backslashToSlash');
const Log = require('log');
const path = require('path');
const fs = require('fs');

describe('Builder is called for file in included directory', () => {

  let builder;
  const contextPath = path.resolve(__dirname + "/../fixtures/include/sample-1/").replace(/\\/g, '/');

  beforeEach(() => {
    builder = new Builder();
    builder.machine.path = contextPath;
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

describe('Builder is called for file in current directory', () => {

  let builder;
  const contextPath = path.resolve(__dirname + "/../fixtures/include/sample-1/dirZ").replace(/\\/g, '/');

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

describe('Builder is called for file in deep included directory', () => {

  let builder;
  const contextPath = path.resolve(__dirname + "/../fixtures/include/").replace(/\\/g, '/');

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

describe('X include Y by absolute remote or local link', () => {

  let builder;
  const contextPath = path.resolve(__dirname + "/../fixtures/include/sample-1/dirZ").replace(/\\/g, '/');

  beforeEach(() => {
    builder = new Builder();
    builder.machine.path = contextPath;
    builder.machine.readers.github.username = process.env.SPEC_GITHUB_USERNAME;
    builder.machine.readers.github.token = process.env.SPEC_GITHUB_PASSWORD || process.env.SPEC_GITHUB_TOKEN;
    builder.machine.clearCache = true;
    builder.logger = new Log(process.env.SPEC_LOGLEVEL || 'error');
  });

  it('should search Y file in remote repository', () => {
    let output = builder.machine.execute(`@include "file_case5.nut"`);
    expect(output).toContain('// y.nut (case 5)\n');
  });

  it('should search Y file by web link', () => {
    let output = builder.machine.execute(`@include "file_case6.nut"`);
    expect(output).toContain('// y.nut (case 6)\n');
  });

  it('should search Y file on root filesystem where builder called', () => {
    fs.rmdirSync("/dirC", { recursive: true });
    fs.mkdirSync("/dirC");
    fs.writeFileSync("/dirC/y7.nut", "// y.nut (case 7)\n");
    let output = builder.machine.execute(`@include "file_case7.nut"`);
    fs.rmdirSync("/dirC", { recursive: true });
    expect(output).toContain('// y.nut (case 7)\n');
  });
});