/**
 * Spec for Machine
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

require('jasmine-expect');
const fs = require('fs');
const Machine = require('../../src/Machine');

const FILE = __dirname + '/../fixtures/sample-6/a.nut';
const init = require('./init')(FILE);

describe('Machine', () => {
  let machine, src;

  beforeEach(() => {
    machine = init.createMachine();
    machine.file = FILE;
    src = fs.readFileSync(FILE, 'utf-8');
  });

  it('should detect cyclic inclusions', () => {
    try {
      machine.execute(src);
    } catch (e) {
      expect(e instanceof Machine.Errors.MaxExecutionDepthReachedError).toBeTruthy();
      expect(e.message).toBe('Maximum execution depth reached, possible cyclic reference? (b.nut:1)');
    }
  });
});
