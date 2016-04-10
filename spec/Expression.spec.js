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
    try {
      expression.evaluate('1/0');
      fail();
    } catch (e) {
      expect(e.message).toMatch('Division by zero');
    }
  });

  it('should recognize variables', () => {
    let res;

    const context = {
      'SOMEVAR1': 123,
      '_SOMEVAR2': 'abc',
      'some_var_3': 100500,
    };

    res = expression.evaluate('SOMEVAR1', context);
    expect(res).toBe(context['SOMEVAR1']);

    res = expression.evaluate('_SOMEVAR2', context);
    expect(res).toBe(context['_SOMEVAR2']);

    res = expression.evaluate('some_var_3 * SOMEVAR1', context);
    expect(res).toBe(context['SOMEVAR1'] * context['some_var_3']);
  });

  it('should support unary operators', () => {
    let res;
    res = expression.evaluate('!10');
    expect(res).toBe(false);
  });

  it('should evaluate conditional expressions', () => {
    let res;

    res = expression.evaluate('1 ? 100 : 200');
    expect(res).toBe(100);

    res = expression.evaluate('0 ? 100 : 200');
    expect(res).toBe(200);

    // should not get to undefined var
    res = expression.evaluate('1 ? 100 : undefinedVar');
    expect(res).toBe(100);
  });

  it('should support array expressions', () => {
    let res;
    res = expression.evaluate('[1,2,3]');
    expect(res).toEqual([1, 2, 3]);
  });

  it('should support member expressions', () => {
    let res;
    res = expression.evaluate('([1,2,3])[1]');
    expect(res).toBe(2);

    const context = {abc: {a: 123}};
    res = expression.evaluate('abc.a', context);
    expect(res).toBe(123);
  });

  it('shuould support string literals', () => {
    let res;

    res = expression.evaluate('"abc"');
    expect(res).toBe('abc');

    res = expression.evaluate('\'abc\'');
    expect(res).toBe('abc');

    // ` quotes are not supported
    try {
      expression.evaluate('`abc`');
      fail();
    } catch (e) {
      expect(e.message).toMatch('Unexpected "`"');
    }
  });

  it('should support functions', () => {
    let res;

    res = expression.evaluate('abs(-10)');
    expect(res).toBe(10);

    res = expression.evaluate('min(-10, 10, -11)');
    expect(res).toBe(-11);

    // min() w/o args
    try {
      res = expression.evaluate('min()');
      fail();
    } catch (e) {
      expect(e.message).toBe('Wrong number of arguments for min()');
    }

    // defined(NON_LITERAL) should produce an error
    try {
      res = expression.evaluate('defined("undefinedVar")');
      fail();
    } catch (e) {
      expect(e.message).toBe('defined() can only be called with an identifier as an argument');
    }

    res = expression.evaluate('defined(undefinedVar)');
    expect(res).toBe(false);

    const context = {definedVar: false};
    res = expression.evaluate('defined(definedVar)', context);
    expect(res).toBe(true);
  });

  it('should not support compound & this expressions', () => {

    try {
      expression.evaluate('"abc" "def"');
      fail();
    } catch (e) {
      expect(e.message).toMatch('Syntax error');
    }

    try {
      expression.evaluate('this');
      fail();
    } catch (e) {
      expect(e.message).toMatch('`this` keyword is not supported');
    }

  });

  // macro declaration expressions

  it('should parse macro declarations #1', () => {
    const res = expression.parseMacroDeclaration('macro1(arg1, arg2)');
    expect(res.name).toBe('macro1');
    expect(res.args).toEqual(['arg1', 'arg2']);
  });

  it('should parse macro declarations #2', () => {
    const res = expression.parseMacroDeclaration('macro1()');
    expect(res.name).toBe('macro1');
    expect(res.args).toEqual([]);
  });

  it('should fail on syntax error in macro declaration #1', () => {
    try {
      expression.parseMacroDeclaration('macro1');
      fail();
    } catch (e) {
      expect(e instanceof Expression.Errors.MacroDeclarationError).toBeTruthy();
      expect(e.message).toBe('Syntax error in macro declaration');
    }
  });

  it('should fail on syntax error in macro declaration #2', () => {
    try {
      expression.parseMacroDeclaration('macro1(1)');
      fail();
    } catch (e) {
      expect(e instanceof Expression.Errors.MacroDeclarationError).toBeTruthy();
      expect(e.message).toBe('Syntax error in macro declaration');
    }
  });

  // macro call expressions

  it('should parse macro call #1', () => {
    const res = expression.parseMacroCall('macro1(1, 2)', {}, {'macro1': {}});
    expect(res.name).toBe('macro1');
    expect(res.args).toEqual([1, 2]);
  });

  it('should parse macro call #2', () => {
    const res = expression.parseMacroCall('macro1()', {}, {'macro1': {}});
    expect(res.name).toBe('macro1');
    expect(res.args).toEqual([]);
  });

  it('should fail on call on undefined macro #1', () => {
    try {
      expression.parseMacroCall('macro1()', {}, {});
      fail();
    } catch (e) {
      expect(e instanceof Expression.Errors.NotMacroError).toBeTruthy();
    }
  });

  it('should fail to parse non-macro call expression', () => {
    try {
      expression.parseMacroCall('macro1', {}, {'macro1': {}});
      fail();
    } catch (e) {
      expect(e instanceof Expression.Errors.NotMacroError).toBeTruthy();
    }
  });

  it('should fail to call undefined function #1', ()=> {
    try {
      expression.evaluate('undefF()');
      fail();
    } catch (e) {
      expect(e instanceof Expression.Errors.FunctionCallError).toBeTruthy();
      expect(e.message).toBe('Function "undefF" is not defined');
    }
  });

  it('should fail to call undefined function #2', ()=> {
    try {
      expression.evaluate('(0)()');
      fail();
    } catch (e) {
      expect(e instanceof Expression.Errors.FunctionCallError).toBeTruthy();
      expect(e.message).toBe('Can\'t call a non-callable expression');
    }
  });

  it('should fail to call undefined function #3', ()=> {
    try {
      expression.evaluate('("abc")()');
      fail();
    } catch (e) {
      expect(e instanceof Expression.Errors.FunctionCallError).toBeTruthy();
      expect(e.message).toBe('Function "abc" is not defined');
    }
  });
});
