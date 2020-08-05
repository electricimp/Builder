// Copyright (c) 2016-2020 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');

const FILE = __dirname + '/../fixtures/sample-3/input.nut';
const init = require('./init')(FILE);
const eol = require('eol');
const path = require('path');

const contextPath = path.dirname(FILE).replace(/\\/g, '/');

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
    const pathToFile1 = path.join(contextPath, 'input.nut').replace(/\\/g, '/');
    const pathToFile2 = path.join(contextPath, 'inc-a.nut').replace(/\\/g, '/');
    machine.generateLineControlStatements = true;
    expect(eol.lf(machine.execute('@include "input.nut"')).split(pathToFile1).join('input.nut').split(pathToFile2).join('inc-a.nut')).toBe(resultWithLC);
  });
});
