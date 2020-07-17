// Copyright (c) 2016-2020 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

const Builder = require('../../src');

describe('Remote relative option is enabled', () => {

  let builder;
  const contextPath = path.resolve(__dirname + "/../fixtures/include/sample-2/").replace(/\\/g, '/');

  beforeEach(() => {
    builder = new Builder();
    builder.machine.remoteRelativeIncludes = true;
    builder.machine.path = contextPath;
    builder.logger = new Log(process.env.SPEC_LOGLEVEL || 'error');
  });

  it('should search Y file in remote repository', () => {
    let output = builder.machine.execute(`@include "file_case1.nut"`);
    expect(output).toContain('// y.nut (case 1)\n');
  });

  it('should search Y file by web link', () => {
    let output = builder.machine.execute(`@include "file_case4.nut"`);
    expect(output).toContain('// y.nut (case 1)\n');
  });

  it('should search Y file in remote repository (root + Y path)', () => {
    let output = builder.machine.execute(`@include "file_case2.nut"`);
    expect(output).toContain('// y.nut (case 2)\n');
  });

  it('should search Y file in remote repository (X path + Y path)', () => {
    let output = builder.machine.execute(`@include "file_case3.nut"`);
    expect(output).toContain('// y.nut (case 3)\n');
  });

});

describe('Remote relative option is not enabled', () => {

  let builder;
  const contextPath = path.resolve(__dirname + "/../fixtures/include/sample-2/").replace(/\\/g, '/');

  beforeEach(() => {
    builder = new Builder();
    builder.machine.remoteRelativeIncludes = false;
    builder.machine.path = contextPath;
    builder.logger = new Log(process.env.SPEC_LOGLEVEL || 'error');
  });

  it('should search Y file in remote repository', () => {
    let output = builder.machine.execute(`@include "file_case1.nut"`);
    expect(output).toContain('// y.nut (case 1)\n');
  });

  it('should search Y file by web link', () => {
    let output = builder.machine.execute(`@include "file_case4.nut"`);
    expect(output).toContain('// y.nut (case 1)\n');
  });
});
