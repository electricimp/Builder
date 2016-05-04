/**
 * Expression spec
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

require('jasmine-expect');

const Expression = require('../../src/Expression');
const EscapeFilter = require('../../src/Filters/EscapeFilter');

describe('Expression', () => {

  let expression;

  beforeEach(() => {
    expression = new Expression();
    expression.filters['escape'] = new EscapeFilter();
  });

  it('apply filter #1', () => {
    const res = expression.evaluate('"something"|escape');
    expect(res).toBe(null);
  });

});
