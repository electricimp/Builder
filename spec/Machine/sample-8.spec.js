// Copyright (c) 2016-2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');

const fs = require('fs');
const path = require('path');
const eol = require('eol');
const jasmineDiffMatchers = require('jasmine-diff-matchers');

const FILE = __dirname + '/../fixtures/sample-8/input.nut';
const init = require('./init')(FILE);

describe('Machine', () => {
  let machine, src;

  beforeEach(() => {
    // show string diffs
    jasmine.addMatchers(jasmineDiffMatchers.diffChars);

    machine = init.createMachine();
    machine.file = path.basename(FILE);
    src = eol.lf(fs.readFileSync(FILE, 'utf-8'));
  });

  it('should run sample #8', () => {
    machine.generateLineControlStatements = false;
    const result = machine.execute(src);
    expect(result).diffChars(init.getResult());
  });

  it('should run sample #8 with line control', () => {
    machine.generateLineControlStatements = true;
    const result = eol.lf(machine.execute(src));
    expect(result).toEqual(init.getResultWithLineControl());
  });

});
