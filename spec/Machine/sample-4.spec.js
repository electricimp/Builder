// Copyright (c) 2016-2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');

const FILE = __dirname + '/../fixtures/sample-4/main.nut';
const init = require('./init')(FILE);
const eol = require('eol');

describe('Machine', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
  });

  it('should do something alright #1', () => {
    const res = eol.lf(machine.execute('@include "main.nut"'));
    expect(res).toBe(init.getResult());

    machine.generateLineControlStatements = true;
    const resLC = eol.lf(machine.execute('@include "main.nut"'));
    expect(resLC).toBe(init.getResultWithLineControl());
  });
});
