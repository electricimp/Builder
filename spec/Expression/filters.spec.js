// Copyright (c) 2016-2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');

const Expression = require('../../src/Expression');

describe('Expression', () => {

  let expression, context;

  beforeEach(() => {
    expression = new Expression();
    context = {};
    context.max = function() {
      return Math.max.apply(Math, [].slice.call(arguments));
    };
  });

  it('should support filter operator with call invocation', () => {
    const res = expression.evaluate('5|max(1,2)', context);
    expect(res).toBe(5);
  });

  it('should support filter operator without call invocation #1', () => {
    const res = expression.evaluate('5|max', context);
    expect(res).toBe(5);
  });

  it('should support filter operator without call invocation #2', () => {
    const res = expression.evaluate('5|("m" + "ax")', context);
    expect(res).toBe(5);
  });

});
