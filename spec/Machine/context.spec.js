// Copyright (c) 2016-2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');

const init = require('./init')('main');
const fs = require('fs');

describe('Machine', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
    machine.fileCache.cacheDir = './test-cache';
  });

  afterEach(() => {
    if (fs.existsSync(machine.fileCache.cacheDir)) {
      machine.clearCache();
    }
  });

  it('should handle context switches', () => {
    const src = `
@macro m1(a, b, c)
  @{a + " " + b + " " + c}
@endmacro
@{a + " " + b + " " + c}
@include m1(11, 22, 33)
@{a + " " + b + " " + c}
`;

    expect(
      machine.execute(src, {
        a: 1, b: 2, c: 3
      })
    ).toBe(`
1 2 3
  11 22 33
1 2 3
`);
  });

  it('should not change includePathParsed object', () => {
    let includePath = 'github:electricimp/Builder/spec/fixtures/sample-11/LineBrakeSample.nut';
    machine.clearCache();
    machine.useCache = true;
    let context = {};
    const reader = machine._getReader(includePath);
    const resFirst = machine.fileCache.read(reader, includePath, machine.dependencies, context);
    const resSecond = machine.fileCache.read(reader, includePath, machine.dependencies, context);
    expect(resSecond.includePathParsed.__PATH__).toBe('github:electricimp/Builder/spec/fixtures/sample-11');

  });
});
