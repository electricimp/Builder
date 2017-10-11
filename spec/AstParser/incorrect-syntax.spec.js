// Copyright (c) 2016-2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');

const AstParser = require('../../src/AstParser');

describe('Tokenizer', () => {
  let parser;

  beforeEach(() => {
    parser = new AstParser();
    parser.file = 'main';
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

  it('should detect incorrect @warning syntax', () => {
    try {
      parser.parse(`@warning`);
      fail();
    } catch (e) {
      expect(e.message).toBe('Syntax error in @warning (main:1)');
    }
  });

  it('should detect incorrect @else syntax', () => {
    try {
      parser.parse(`@if 1\n@else 0\n@endif`);
      fail();
    } catch (e) {
      expect(e.message).toBe('Syntax error in @else (main:2)');
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

describe('Parser', () => {
  let parser;

  beforeEach(() => {
    parser = new AstParser();
  });

  it('should detect multiple @else', () => {
    try {
      parser.parse(
        `@if 1
@else
@else
@endif`
      );
      fail();
    } catch (e) {
      expect(e.message).toBe('Multiple @else statements are not allowed (main:3)');
    }
  });

  it('should detect unexpected @else', () => {
    try {
      parser.parse(
        `@else`
      );
      fail();
    } catch (e) {
      expect(e.message).toBe('Unexpected @else (main:1)');
    }
  });

  it('should detect unexpected @elseif', () => {
    try {
      parser.parse(
        `@elseif 1`
      );
      fail();
    } catch (e) {
      expect(e.message).toBe('Unexpected @elseif (main:1)');
    }
  });

  it('should detect unexpected @endif', () => {
    try {
      parser.parse(
        `@endif`
      );
      fail();
    } catch (e) {
      expect(e.message).toEqual('Unexpected @endif (main:1)');
    }
  });

  it('should detect @elseif after @else', () => {
    try {
      parser.parse(
        `@if 1\n@else\n@elseif 1\n@endif`
      );
      fail();
    } catch (e) {
      expect(e.message).toEqual('@elseif after @else is not allowed (main:3)');
    }
  });

  it('should detect unclosed @if', () => {
    try {
      parser.parse(
        `@if 1\n@else`
      );
      fail();
    } catch (e) {
      expect(e.message).toEqual('Unclosed @if statement (main:2)');
    }
  });

  it('should detect unclosed @if #1', () => {
    try {
      parser.parse(
        `@if 1`
      );
      fail();
    } catch (e) {
      expect(e.message).toEqual('Unclosed @if statement (main:1)');
    }
  });

  it('should detect unclosed @if #2', () => {
    try {
      parser.parse(
        `something\n@if 1`
      );
      fail();
    } catch (e) {
      expect(e.message).toEqual('Unclosed @if statement (main:2)');
    }
  });

  it('should detect unclosed @macro', () => {
    try {
      parser.parse(
        `@macro abc(def)`
      );
      fail();
    } catch (e) {
      expect(e.message).toEqual('Unclosed @macro statement (main:1)');
    }
  });

  it('should detect incorrect syntax for @endmacro', () => {
    try {
      parser.parse(
        `@endmacro 123`
      );
      fail();
    } catch (e) {
      expect(e.message).toEqual('Syntax error in @endmacro (main:1)');
    }
  });

  it('should detect unexpected @endmacro', () => {
    try {
      parser.parse(
        `@endmacro`
      );
      fail();
    } catch (e) {
      expect(e.message).toEqual('Unexpected @endmacro (main:1)');
    }
  });

  it('should detect unexpected @end', () => {
    try {
      parser.parse(
        `\n@end`
      );
      fail();
    } catch (e) {
      expect(e.message).toEqual('Unexpected @end (main:2)');
    }
  });

  it('should detect incorrect @end syntax', () => {
    try {
      parser.parse(
        `\n@end abc`
      );
      fail();
    } catch (e) {
      expect(e.message).toEqual('Syntax error in @end (main:2)');
    }
  });

  it('should fail on incorrect include-once syntax', () => {
    try {
      parser.parse(`@include "source"\n@include once`);
      fail();
    } catch (e) {
      expect(e instanceof AstParser.Errors.SyntaxError).toBeTruthy();
      expect(e.message).toEqual('Syntax error in @include (main:2)');
    }
  });

  it('should fail on incorrect @while syntax #1', () => {
    try {
      parser.parse(`@while`);
      fail();
    } catch (e) {
      expect(e instanceof AstParser.Errors.SyntaxError).toBeTruthy();
      expect(e.message).toEqual('Syntax error in @while (main:1)');
    }
  });

  it('should fail on incorrect @while syntax #2', () => {
    try {
      parser.parse(`@while abc\n`);
      fail();
    } catch (e) {
      expect(e instanceof AstParser.Errors.SyntaxError).toBeTruthy();
      expect(e.message).toEqual('Unclosed @while statement (main:1)');
    }
  });

  it('should fail on incorrect @repeat syntax #1', () => {
    try {
      parser.parse(`@repeat`);
      fail();
    } catch (e) {
      expect(e instanceof AstParser.Errors.SyntaxError).toBeTruthy();
      expect(e.message).toEqual('Syntax error in @repeat (main:1)');
    }
  });

  it('should fail on incorrect @repeat syntax #2', () => {
    try {
      parser.parse(`@repeat abc\n`);
      fail();
    } catch (e) {
      expect(e instanceof AstParser.Errors.SyntaxError).toBeTruthy();
      expect(e.message).toEqual('Unclosed @repeat statement (main:1)');
    }
  });

  it('should fail on incorrect @repeat syntax #3', () => {
    try {
      parser.parse(`@while abc\n@repeat 10\n@endrepeat\n`);
      fail();
    } catch (e) {
      expect(e instanceof AstParser.Errors.SyntaxError).toBeTruthy();
      expect(e.message).toEqual('Unclosed @while statement (main:3)');
    }
  });
});
