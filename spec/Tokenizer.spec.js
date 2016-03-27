/**
 * Spec for Tokenizer
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

require('jasmine-expect');

const Tokenizer = require('../src/Tokenizer');

describe('Tokenizer', () => {

  it('should handle spaces correctly', () => {
    // canonical @include form
    expect(Tokenizer.tokenizeLine('@include some file'))
      .toEqual({token: Tokenizer.tokens.INCLUDE, source: 'some file'});

    // extra spaces between token and value
    expect(Tokenizer.tokenizeLine('@include   some file'))
      .toEqual({token: Tokenizer.tokens.INCLUDE, source: 'some file'});

    // extra spaces before/after value
    expect(Tokenizer.tokenizeLine('@include   some file  '))
      .toEqual({token: Tokenizer.tokens.INCLUDE, source: 'some file'});

    // source line, w/o extra spaces
    expect(Tokenizer.tokenizeLine('just source line'))
      .toEqual({token: Tokenizer.tokens.SOURCE_LINE, line: 'just source line'});

    // source line, with extra spaces (should be preserved)
    expect(Tokenizer.tokenizeLine(' just source line  '))
      .toEqual({token: Tokenizer.tokens.SOURCE_LINE, line: ' just source line  '});
  });

  it('should break multiline source into correct number of tokens', () => {
    const res = Tokenizer.tokenize('@include abc\nline2\r\nline3\n');
    expect(res).toBeArrayOfObjects();
    expect(res).toBeArrayOfSize(4);
  });

  it('should parse @define correctly', () => {
    const res = Tokenizer.tokenizeLine('@define  varname  expression');
    expect(res).toEqual({
      token: Tokenizer.tokens.DEFINE,
      varname: 'varname',
      value: 'expression'
    });
  });

  it('should throw error on incorrect @define syntax', () => {
    expect(() => Tokenizer.tokenizeLine('@define 1varname  expression'))
      // todo: check for custom error type
      .toThrowAnyError();
  });
});
