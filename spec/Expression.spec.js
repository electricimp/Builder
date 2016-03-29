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
    let res;

    res = expression.evaluate('156*4+3');
    expect(res).toBe(627);

    res = expression.evaluate('(256 - 128) / 2');
    expect(res).toBe(64);

    res = expression.evaluate('true || false && false');
    expect(res).toBe(true);

    // division by zero should throw an error
    // todo: check for custom err type
    expect(() => expression.evaluate('1/0')).toThrowAnyError();
  });

  it('should recognize variables', () => {
    let res;

    expression.variables = {
      'SOMEVAR1' : 123,
      '_SOMEVAR2' : 'abc',
      'some_var_3' : 100500,
    };

    res = expression.evaluate('SOMEVAR1');
    expect(res).toBe(expression.variables['SOMEVAR1']);

    res = expression.evaluate('_SOMEVAR2');
    expect(res).toBe(expression.variables['_SOMEVAR2']);

    res = expression.evaluate('some_var_3 * SOMEVAR1');
    expect(res).toBe(expression.variables['SOMEVAR1'] * expression.variables['some_var_3']);
  });

  it('should do fine with unary operators', () => {
    let res;

    res = expression.evaluate('!10');
    expect(res).toBe(false);
  });

  it('should not support compound, this, member expressions', () => {
    // todo: check for custom type
    expect(() => expression.evaluate('"abc" "def"')).toThrowAnyError();
    expect(() => expression.evaluate('this')).toThrowAnyError();
    expect(() => expression.evaluate('abc.def')).toThrowAnyError();
    expect(() => expression.evaluate('abc["def"]')).toThrowAnyError();
  });
});
