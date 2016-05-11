/**
 * Spec for Machine
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

require('jasmine-expect');

const fs = require('fs');
const path = require('path');
const jasmineDiffMatchers = require('jasmine-diff-matchers');

const FILE = __dirname + '/../fixtures/sample-7/input.nut';
const init = require('./init')(FILE);

describe('Machine', () => {
  let machine, src;

  beforeEach(() => {
    // show string diffs
    jasmine.addMatchers(jasmineDiffMatchers.diffChars);

    machine = init.createMachine();
    machine.file = path.basename(FILE);
    src = fs.readFileSync(FILE, 'utf-8');
  });

  it('should run sample #7', () => {
    machine.generateLineControlStatements = false;
    const result = machine.execute(src);
    expect(result).diffChars(init.getResult());
  });

  it('should run sample #7 with line control', () => {
    machine.generateLineControlStatements = true;
    const result = machine.execute(src);
    expect(result).toEqual(init.getResultWithLineControl());
  });

});
