/**
 * MacroExpression spec
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

const MacroExpression = require('../src/MacroExpression');

describe('MacroExpression', () => {

  let e;

  beforeEach(() => {
    e = new MacroExpression();
  });

  it('should parse macro declarations #1', () => {
    e.parseDeclaration('macro1(arg1, arg2)');
    expect(e.macroName).toBe('macro1');
    expect(e.args).toEqual(['arg1', 'arg2']);
  });

  it('should parse macro declarations #2', () => {
    e.parseDeclaration('macro1()');
    expect(e.macroName).toBe('macro1');
    expect(e.args).toEqual([]);
  });

  it('should fail on syntax error #1', () => {
    try {
      e.parseDeclaration('macro1');
      fail();
    } catch  (e) {
      expect(e instanceof MacroExpression.Errors.SyntaxError).toBeTruthy();
      expect(e.message).toBe('Syntax error in macro declaration');
    }
  });

  it('should fail on syntax error #2', () => {
    try {
      e.parseDeclaration('macro1(1)');
      fail();
    } catch  (e) {
      expect(e instanceof MacroExpression.Errors.SyntaxError).toBeTruthy();
      expect(e.message).toBe('Syntax error in macro declaration');
    }
  });

});
