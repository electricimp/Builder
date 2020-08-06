// Copyright (c) 2016-2020 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');
const path = require('path');

const FILE = __dirname + '/../fixtures/sample-4/main.nut';
const init = require('./init')(FILE);
const eol = require('eol');

const contextPath = path.dirname(FILE).replace(/\\/g, '/');

describe('Machine', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
  });

  it('should do something alright #1', () => {
    const res = eol.lf(machine.execute('@include "main.nut"'));
    expect(res).toBe(init.getResult());

    machine.generateLineControlStatements = true;
    const pathToFile1 = path.join(contextPath, 'main.nut').replace(/\\/g, '/');
    const pathToFile2 = path.join(contextPath, 'a.nut').replace(/\\/g, '/');
    let resLC = eol.lf(machine.execute('@include "main.nut"')).split(pathToFile1).join('main.nut');
    resLC = resLC.split(pathToFile2).join('a.nut');
    expect(resLC).toBe(init.getResultWithLineControl());
  });
});
