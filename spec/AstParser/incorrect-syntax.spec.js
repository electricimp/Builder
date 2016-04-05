/**
 * Spec for AST Parser
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

require('jasmine-expect');

const AstParser = require('../../src/AstParser');

describe('AstParser', () => {
  let parser;

  beforeEach(() => {
    parser = new AstParser();
  });

  it('should detect incorrect @if syntax', () => {
    try {
      parser.parse(
`@if
@endif`
      );
      fail();
    } catch (e) {
      expect(e.message).toBe('Syntax error in @if (main:1)');
    }
  });

  it('should detect incorrect @elseif syntax', () => {
    try {
      parser.parse(
`@if 1
@elseif
@endif`
      );
      fail();
    } catch (e) {
      expect(e.message).toBe('Syntax error in @elseif (main:2)');
    }
  });

  it('should detect incorrect @set syntax #1', () => {
    try {
      parser.parse(`@set`);
      fail();
    } catch (e) {
      expect(e.message).toBe('Syntax error in @set (main:1)');
    }
  });

  it('should detect incorrect @set syntax #2', () => {
    try {
      parser.parse(`@set 123`);
      fail();
    } catch (e) {
      expect(e.message).toBe('Syntax error in @set (main:1)');
    }
  });

  it('should detect incorrect @set syntax #3', () => {
    try {
      parser.parse(`@set abc`);
      fail();
    } catch (e) {
      expect(e.message).toBe('Syntax error in @set (main:1)');
    }
  });

  it('should detect incorrect @include syntax', () => {
    try {
      parser.parse(`@include`);
      fail();
    } catch (e) {
      expect(e.message).toBe('Syntax error in @include (main:1)');
    }
  });

  it('should detect incorrect @error syntax', () => {
    try {
      parser.parse(`@error`);
      fail();
    } catch (e) {
      expect(e.message).toBe('Syntax error in @error (main:1)');
    }
  });

  it('should detect incorrect @else syntax', () => {
    try {
      parser.parse(`@else 1`);
      fail();
    } catch (e) {
      expect(e.message).toBe('Syntax error in @else (main:1)');
    }
  });

  it('should detect incorrect @endif syntax', () => {
    try {
      parser.parse(`@endif 1`);
      fail();
    } catch (e) {
      expect(e.message).toBe('Syntax error in @endif (main:1)');
    }
  });
});
