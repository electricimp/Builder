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

  it('should parse macro definitions', () => {
    e.parseDefinition('macro1(arg1, arg2)');
    console.log(e);
  });

});
