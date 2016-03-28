/**
 * Expression spec
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

require('jasmine-expect');

const Expression = require('../src/Expression');

describe('Expression', () => {

  let expression;

  beforeEach(() => {
    expression = new Expression();
    expression.variables = {};
  });

  it('should evaluate expressions with binary operators', () => {
    const res = expression.evaluate('156*4+3');
    console.log(res);
  });

});
