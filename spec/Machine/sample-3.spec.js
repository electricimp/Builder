/**
 * Spec for Machine
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

require('jasmine-expect');

const FILE = __dirname + '/../fixtures/sample-3/input.nut';
const init = require('./init')(FILE);

describe('Machine', () => {
  let machine, result, resultWithLC;

  beforeEach(() => {
    machine = init.createMachine();
    result = init.getResult();
    resultWithLC = init.getResultWithLineControl();
  });

  it('should do something alright #1', () => {
    // w/o line control
    expect(machine.execute('@include "input.nut"')).toBe(result);

    // with line control
    machine.generateLineControlStatements = true;
    expect(machine.execute('@include "input.nut"')).toBe(resultWithLC);
  });
});
