/**
 * Spec for Machine
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

require('jasmine-expect');
const fs = require('fs');
const AstParser = require('../../src/AstParser');
const Machine = require('../../src/Machine');

const FILE = __dirname + '/../fixtures/sample-5/main.nut';
const init = require('./init')(FILE);

describe('Machine', () => {
  let machine, src;

  beforeEach(() => {
    machine = init.createMachine();
    machine.file = FILE;
    src = fs.readFileSync(FILE, 'utf-8');
  });

  it('should do throw a correct error message #1', () => {
    try {
      machine.execute(src, {TEST: 'set'});
    } catch (e) {
      expect(e instanceof AstParser.Errors.SyntaxError).toBeTruthy();
      expect(e.message).toBe('Syntax error in @set (set.inc.nut:3)');
    }
  });

  it('should do throw a correct error message #2', () => {
    try {
      machine.execute(src, {TEST: 'expression'});
    } catch (e) {
      expect(e instanceof Machine.Errors.ExpressionEvaluationError).toBeTruthy();
      expect(e.message).toBe('Function "someUndefinedFunc" is not defined (expression.inc.nut:3)');
    }
  });
});
