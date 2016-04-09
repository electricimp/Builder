/**
 * Spec for AST Parser
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

require('jasmine-expect');

const init = require('./init')('main');
const Machine = require('../../src/Machine');

describe('Machine', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
  });

  it('should define and use a variable', () => {
    const res = machine.execute(`@set abc "def"\n@{abc}`);
    expect(res).toBe(`def`);
  });

  it('should use predefined vars', () => {
    const res = machine.execute(`@{__FILE__}:@{__LINE__}`);
    expect(res).toBe(`main:1`);
  });

  it('should handle undefined vars', () => {
    expect(machine.execute(`@{abc}`)).toBe('null');
    expect(machine.execute(`@if abc\n123\n@endif`)).toBe('');
    expect(machine.execute(`@if !abc\n123\n@endif`)).toBe('123\n');
  });

  it('should handle conditional expressions', () => {

    const src = `
@if a
  // if-consequent
@elseif b
  // if-elseif[0]
@elseif c
  // if-elseif[1]
  @if defined(undefinedVar)
    // ignored
  @endif
@else
  // if-else
@endif
`;
    expect(machine.execute(src, {
      a: true
    })).toBe(`\n  // if-consequent\n`);

    expect(machine.execute(src, {
      a: false,
      b: true
    })).toBe(`\n  // if-elseif[0]\n`);

    expect(machine.execute(src, {
      a: false,
      b: false,
      c: true
    })).toBe(`\n  // if-elseif[1]\n`);

    expect(machine.execute(src, {
      a: false,
      b: false,
      c: false
    })).toBe(`\n  // if-else\n`);

  });

  it('should handle @error directives', () => {
    try {
      machine.execute(`@error "abc"`);
      fail();
    } catch (e) {
      expect(e instanceof Machine.Errors.UserDefinedError).toBe(true);
      expect(e.message).toBe('abc');
    }
  });

  it('should not allow macro redeclaration', () => {
    try {
      machine.execute(`@macro A()\n@endmacro\n@macro A()\n@endmacro`);
      fail();
    } catch (e) {
      expect(e instanceof Machine.Errors.MacroIsAlreadyDeclared).toBe(true);
      expect(e.message).toBe('Macro "A" is alredy declared in main:1 (main:3)');
    }
  });
});
