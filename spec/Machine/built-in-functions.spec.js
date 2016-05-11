/**
 * Spec for Machine
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

  it('should handle built-in functions #1', () => {
    const res = machine.execute(
`@{include('abc')}`
);

    console.log(res);
    // expect(res).toEqual(`a.builder\nb.builder\nc.builder\n`);
  });
});
