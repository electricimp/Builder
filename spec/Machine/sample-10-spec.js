// Copyright (c) 2016-2020 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');

const FILE = __dirname + '/../fixtures/sample-10/input.nut';
const init = require('./init')(FILE);
const eol = require('eol');
const path = require('path');

const contextPath = path.resolve(path.dirname(FILE)).replace(/\\/g, '/');

describe('Machine', () => {
  let machine, result, resultWithLC;

  beforeEach(() => {
    machine = init.createMachine();
    result = init.getResult();
    resultWithLC = init.getResultWithLineControl();
  });

  it('should do something alright #1', () => {
    machine.path = contextPath;
    expect(eol.lf(machine.execute('@include "input.nut"'))).toBe(result);
    machine.generateLineControlStatements = true;
    const pathToFile1 = path.join(contextPath, 'inc-a.nut').replace(/\\/g, '/');
    const pathToFile2 = path.join(contextPath, 'inc-b.nut').replace(/\\/g, '/');
    const pathToFile3 = path.join(contextPath, 'inc-c.nut').replace(/\\/g, '/');
    const pathToFile4 = path.join(contextPath, 'inc-d.nut').replace(/\\/g, '/');
    const pathToFile5 = path.join(contextPath, '1/2/inc-c.nut').replace(/\\/g, '/');
    const pathToFile6 = path.join(contextPath, '1/inc-d.nut').replace(/\\/g, '/');
    let resLC = eol.lf(machine.execute('@include "input.nut"')).split(pathToFile1).join('inc-a.nut');
    resLC = resLC.split(pathToFile2).join('inc-b.nut').split(pathToFile3).join('inc-c.nut');
    resLC = resLC.split(pathToFile4).join('inc-d.nut').split(pathToFile5).join('1/2/inc-c.nut');
    resLC = resLC.split(pathToFile6).join('1/inc-d.nut');
    expect(resLC).toBe(resultWithLC.replace(/\\/g, '/'));
  });
});
