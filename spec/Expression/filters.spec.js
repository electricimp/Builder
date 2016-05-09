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

  it('should suppor filter operator with extra arguments', () => {
    const res = expression.evaluate('5|max(1,2)', {});
    expect(res).toBe(5);
  });

  it('should suppor filter operator without extra arguments', () => {
    const res = expression.evaluate('5|max', {});
    expect(res).toBe(5);
  });

});
