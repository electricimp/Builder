/**
 * Spec for Machine
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

require('jasmine-expect');

const FILE = __dirname + '/../fixtures/sample-4/main.nut';
const init = require('./init')(FILE);

describe('Machine', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
  });

  it('should do something alright #1', () => {
    const res = machine.execute('@include "main.nut"');
    expect(res).toBe(init.getResult());

    machine.generateLineControlStatements = true;
    const resLC = machine.execute('@include "main.nut"');
    expect(resLC).toBe(init.getResultWithLineControl());
  });
});
