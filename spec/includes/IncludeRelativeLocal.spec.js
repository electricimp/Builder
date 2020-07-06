// Copyright (c) 2016-2020 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

const Builder = require('../../src');

fdescribe('Builder is called for file in included directory', () => {

  let builder;

  beforeEach(() => {
    builder = new Builder();
  });

  it('should search Y file in directory where X file located', () => {
    let output = builder.machine.execute(`
      @include "dirZ/file_case1.nut"
    `);
    expect(output).toContain('// y.nut (case 1)');
  });

  it('should search Y file in directory where processing file located', () => {
    let output = builder.machine.execute(`
        @include "dirZ/file_case2.nut"
      `);
    expect(output).toContain('// y.nut (case 2)');
  });

  it('should search Y file in directory where builder called', () => {
    let output = builder.machine.execute(`
          @include "dirZ/file_case3.nut"
        `);
    expect(output).toContain('// y.nut (case 3)');
  });
});
