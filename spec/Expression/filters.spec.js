/**
 * Expression spec
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

require('jasmine-expect');

const Expression = require('../../src/Expression');

describe('Expression', () => {

  let expression;

  beforeEach(() => {
    expression = new Expression();
  });

  it('should suppor filter operator with call invocation', () => {
    const res = expression.evaluate('5|max(1,2)', {});
    expect(res).toBe(5);
  });

  it('should suppor filter operator without call invocation #1', () => {
    const res = expression.evaluate('5|max', {});
    expect(res).toBe(5);
  });

  it('should suppor filter operator without call invocation #2', () => {
    const res = expression.evaluate('5|("m" + "ax")', {});
    expect(res).toBe(5);
  });

});
