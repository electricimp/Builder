// Copyright (c) 2016-2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');

const FILE = __dirname + '/../fixtures/sample-2/input.nut';
const init = require('./init')(FILE);
const eol = require('eol');

describe('Machine', () => {
  let machine, result, resultWithLC;

  beforeEach(() => {
    machine = init.createMachine();
    result = init.getResult();
    resultWithLC = init.getResultWithLineControl();
  });

  it('should do something alright #1', () => {
    // w/o line control
    expect(eol.lf(machine.execute('@include "input.nut"'))).toBe(result);

    // with line control
    machine.generateLineControlStatements = true;
    expect(eol.lf(machine.execute('@include "input.nut"'))).toBe(resultWithLC);
  });
});
