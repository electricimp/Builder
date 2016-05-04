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

  // it('should fail to parse non-macro call expression', () => {
  //   const res = expression.parseFiltersCall('expression|filters', {}, {'macro1': {}});
  //   expect(res).toBe(null);
  // });

});
