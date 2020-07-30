// Copyright (c) 2016-2020 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');
const path = require('path');

const FILE = __dirname + '/../fixtures/sample-9/input.nut';
const init = require('./init')(FILE);
const eol = require('eol');

const contextPath = path.dirname(FILE).replace(/\\/g, '/');

describe('Machine', () => {
  let machine, result, resultWithLC;

  beforeEach(() => {
    machine = init.createMachine();
    result = init.getResult();
    resultWithLC = init.getResultWithLineControl();
  });

  it('should do something alright #1', () => {
    expect(eol.lf(machine.execute('@include "input.nut"'))).toBe(result);
    machine.generateLineControlStatements = true;
    const pathToFile = path.join(contextPath, 'input.nut').replace(/\\/g, '/');
    expect(eol.lf(machine.execute('@include "input.nut"')).split(pathToFile).join('input.nut')).toBe(resultWithLC);
  });
});
