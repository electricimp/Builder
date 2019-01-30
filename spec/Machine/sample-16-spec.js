// Copyright (c) 2016-2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');
const Fixture = require('fixture-stdout');

const FILE = __dirname + '/../fixtures/sample-16/input.nut';
const init = require('./init')(FILE);
const eol = require('eol');

describe('Machine', () => {
  let machine, result;

  beforeEach(() => {
    machine = init.createMachine();
    result = init.getResult();
  });

  it('should exhibit the expected behaviour when applying string library functions', () => {
    expect(eol.lf(machine.execute('@include "input.nut"'))).toBe(result);
  });
});
