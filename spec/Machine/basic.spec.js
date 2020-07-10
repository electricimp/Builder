// Copyright (c) 2016-2020 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');

const Fixture = require('fixture-stdout');
const stderrFixture = new Fixture({ stream: process.stderr });
const init = require('./init')('main');
const Machine = require('../../src/Machine');
const path = require('path');

const contextPath = path.resolve(__dirname, './../..');
const filePath = path.join(contextPath, 'main');

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

  it('should handle @warning directives', (done) => {
    // Our warning message
    const text = 'abc';
    // What we expect to be logged to STDERR
    const yellowTextLine = `\x1b[33m${text}\u001b[39m\n`;
    try {
      // Capture STDERR messages
      stderrFixture.capture(message => {
        try {
          expect(message).toBe(yellowTextLine);
          // Release STDERR
          stderrFixture.release();
          done();
        } catch (e) {
          fail(e);
        }
        // Returning false prevents message actually being logged to STDERR
        return false;
      });

      machine.execute(`@warning "${text}"`);
    } catch (e) {
      fail(e);
    }
  });

  it('should not allow macro redeclaration', () => {
    try {
      machine.execute(`@macro A()\n@endmacro\n@macro A()\n@endmacro`);
      fail();
    } catch (e) {
      expect(e instanceof Machine.Errors.MacroIsAlreadyDeclared).toBe(true);
      expect(e.message).toBe('Macro "A" is already declared in main:1 (' + filePath + ':3)');
    }
  });

  it('should handle errors in @include-macro expressions', () => {
    try {
      machine.execute(`@include ~~~`);
      fail();
    } catch (e) {
      expect(e instanceof Machine.Errors.ExpressionEvaluationError).toBe(true);
      expect(e.message).toBe('Unexpected "~" at character 0 (' + filePath + ':1)');
    }
  });

  it('should handle errors in @macro declaration', () => {
    try {
      machine.execute(`@macro ~~~\n@end`);
      fail();
    } catch (e) {
      expect(e instanceof Machine.Errors.ExpressionEvaluationError).toBe(true);
      expect(e.message).toBe('Unexpected "~" at character 0 (' + filePath + ':1)');
    }
  });
});
