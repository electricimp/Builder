/**
 * Spec for Machine
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

require('jasmine-expect');
const init = require('./init')('main');
const Machine = require('../../src/Machine');

describe('Machine', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
  });

  it('should handle built-in function include()', () => {
    const res = machine.execute(
`@{include('${__dirname + '/../fixtures/lib/d.builder'}')|escape}`
);
    expect(res).toEqual(`d.builder\\nd.builder:2`);
  });

  it('should handle errors in include() calls', () => {
    try {
      machine.execute(`\n@{include()}`);
      fail();
    } catch (e) {
      expect(e instanceof Machine.Errors.ExpressionEvaluationError).toBe(true);
      expect(e.message).toBe('Wrong number of arguments for include() (main:2)');
    }
  });
});
