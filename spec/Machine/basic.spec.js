/**
 * Spec for AST Parser
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

require('jasmine-expect');

const init = require('./init')('main');

describe('Machine', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
  });

  it('should define and use a variable', () => {
    const res = machine.execute(`@set abc "def"\n@{abc}`);
    expect(res).toBe(`def`);
  });

  it('should throw an error on undefined variable use', () => {
    try {
      machine.execute(`@{abc}`);
      fail();
    } catch (e) {
      expect(e.message).toBe('Variable "abc" is not defined');
    }
  });
});
