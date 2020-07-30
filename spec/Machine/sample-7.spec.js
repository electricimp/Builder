// Copyright (c) 2016-2020 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');

const fs = require('fs');
const path = require('path');
const eol = require('eol');

const FILE = __dirname + '/../fixtures/sample-7/input.nut';
const init = require('./init')(FILE);

const contextPath1 = path.resolve(__dirname, './../..').replace(/\\/g, '/');
const contextPath2 = path.dirname(FILE).replace(/\\/g, '/');

describe('Machine', () => {
  let machine, src;

  beforeEach(() => {
    machine = init.createMachine();
    machine.file = path.basename(FILE);
    src = eol.lf(fs.readFileSync(FILE, 'utf-8'));
  });

  it('should run sample #7', () => {
    machine.generateLineControlStatements = false;
    const result = eol.lf(machine.execute(src));
    expect(result).toEqual(init.getResult());
  });

  it('should run sample #7 with line control', () => {
    const pathToFile1 = path.join(contextPath1, 'input.nut').replace(/\\/g, '/');
    const pathToFile2 = path.join(contextPath2, 'inc-a.nut').replace(/\\/g, '/');
    const pathToFile3 = path.join(contextPath2, 'inc-b.nut').replace(/\\/g, '/');
    machine.generateLineControlStatements = true;
    let result = eol.lf(machine.execute(src)).split(pathToFile1).join('input.nut');
    result = result.split(pathToFile2).join('inc-a.nut');
    result = result.split(pathToFile3).join('inc-b.nut');
    expect(result).toEqual(init.getResultWithLineControl());
  });

});
