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

    // create Math.* function
    const mathFunction = (name) => {
      return function() {
        const args = [].slice.call(arguments);
        if (args.length < 1) {
          throw new Error('Wrong number of arguments for ' + name + '()');
        }
        return Math[name].apply(Math, args);
      };
    };

    context['abs'] = mathFunction('abs');
    context['min'] = mathFunction('min');
    context['max'] = mathFunction('max');
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

    context['SOMEVAR1'] = 123;
    context['_SOMEVAR2'] = 'abc';
    context['some_var_3'] = 100500;

    res = expression.evaluate('SOMEVAR1', context);
    expect(res).toBe(context['SOMEVAR1']);

    res = expression.evaluate('_SOMEVAR2', context);
    expect(res).toBe(context['_SOMEVAR2']);

    res = expression.evaluate('some_var_3 * SOMEVAR1', context);
    expect(res).toBe(context['SOMEVAR1'] * context['some_var_3']);
  });

  it('should support unary operators', () => {
    let res;
    res = expression.evaluate('!10', context);
    expect(res).toBe(false);
  });

  it('should evaluate conditional expressions', () => {
    let res;

    res = expression.evaluate('1 ? 100 : 200', context);
    expect(res).toBe(100);

    res = expression.evaluate('0 ? 100 : 200', context);
    expect(res).toBe(200);

    // should not get to undefined var
    res = expression.evaluate('1 ? 100 : undefinedVar', context);
    expect(res).toBe(100);
  });

  it('should support array expressions', () => {
    let res;
    res = expression.evaluate('[1,2,3]', context);
    expect(res).toEqual([1, 2, 3]);
  });

  it('should support member expressions', () => {
    let res;
    res = expression.evaluate('([1,2,3])[1]', context);
    expect(res).toBe(2);

    context.abc = {a: 123};
    res = expression.evaluate('abc.a', context);
    expect(res).toBe(123);
  });

  it('shuould support string literals', () => {
    let res;

    res = expression.evaluate('"abc"', context);
    expect(res).toBe('abc');

    res = expression.evaluate('\'abc\'', context);
    expect(res).toBe('abc');

    // ` quotes are not supported
    try {
      expression.evaluate('`abc`', context);
      fail();
    } catch (e) {
      expect(e.message).toMatch('Unexpected "`"');
    }
  });

  it('should support functions', () => {
    let res;

    res = expression.evaluate('abs(-10)', context);
    expect(res).toBe(10);

    res = expression.evaluate('min(-10, 10, -11)', context);
    expect(res).toBe(-11);

    // min() w/o args
    try {
      res = expression.evaluate('min()', context);
      fail();
    } catch (e) {
      expect(e.message).toBe('Wrong number of arguments for min()');
    }

    // defined(NON_LITERAL) should produce an error
    try {
      res = expression.evaluate('defined("undefinedVar")', context);
      fail();
    } catch (e) {
      expect(e.message).toBe('defined() can only be called with an identifier as an argument');
    }

    res = expression.evaluate('defined(undefinedVar)', context);
    expect(res).toBe(false);

    context.definedVar = false;
    res = expression.evaluate('defined(definedVar)', context);
    expect(res).toBe(true);
  });

  it('should not support compound & this expressions', () => {

    try {
      expression.evaluate('"abc" "def"', context);
      fail();
    } catch (e) {
      expect(e.message).toMatch('Syntax error');
    }

    try {
      expression.evaluate('this', context);
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
    const res = expression.parseMacroCall('macro1()', {}, {});
    expect(res).toBe(null);
  });

  it('should fail to parse non-macro call expression', () => {
    const res = expression.parseMacroCall('macro1', {}, {'macro1': {}});
    expect(res).toBe(null);
  });

  it('should fail to call undefined function #1', ()=> {
    try {
      expression.evaluate('undefF()', context);
      fail();
    } catch (e) {
      expect(e instanceof Expression.Errors.FunctionCallError).toBeTruthy();
      expect(e.message).toBe('Function "undefF" is not defined');
    }
  });

  it('should fail to call undefined function #2', ()=> {
    try {
      expression.evaluate('(0)()', context);
      fail();
    } catch (e) {
      expect(e instanceof Expression.Errors.FunctionCallError).toBeTruthy();
      expect(e.message).toBe('Can\'t call a non-callable expression');
    }
  });

  it('should fail to call undefined function #3', ()=> {
    try {
      expression.evaluate('("abc")()', context);
      fail();
    } catch (e) {
      expect(e instanceof Expression.Errors.FunctionCallError).toBeTruthy();
      expect(e.message).toBe('Function "abc" is not defined');
    }
  });

  it('should fail on incorrect filter operator usage', ()=> {
    try {
      expression.evaluate('|abs', context);
      fail();
    } catch (e) {
      expect(e instanceof Expression.Errors.ExpressionError).toBeTruthy();
      expect(e.message).toBe('Syntax error in "|" operator');
    }
  });

  it('should fail on incorrect nuber of args for a function', ()=> {
    try {
      expression.evaluate('abs()', context);
      fail();
    } catch (e) {
      expect(e instanceof Expression.Errors.ExpressionError).toBeTruthy();
      expect(e.message).toBe('Wrong number of arguments for abs()');
    }
  });
});
