/**
 * Spec for AST Parser
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

require('jasmine-expect');

const FILE = __dirname + '/../fixtures/sample-2/input.nut';
const init = require('./init')(FILE);

describe('Machine', () => {
  let machine, result;

  beforeEach(() => {
    machine = init.createMachine();
    result = init.getResult();
  });

  it('should do something alright #1', () => {
    expect(machine.execute('@include "input.nut"')).toBe(result);
  });
});
