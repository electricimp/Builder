// Copyright (c) 2016-2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');
const path = require('path');

const FILE = __dirname + '/../fixtures/sample-10/input.nut';
const init = require('./init')(FILE);

describe('Machine', () => {
  let machine, result, resultWithLC;

  beforeEach(() => {
    machine = init.createMachine();
    result = init.getResult();
    resultWithLC = init.getResultWithLineControl();
  });

  it('should do something alright #1', () => {
    expect(machine.execute('@include "input.nut"').replace(/\\/g, '/')).toBe(result);
    machine.generateLineControlStatements = true;
    expect(machine.execute('@include "input.nut"').replace(/\\/g, '/')).toBe(resultWithLC);
  });
});
