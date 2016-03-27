/**
 * Spec for Tokenizer
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

require('jasmine-expect');

const SourceParser = require('../src/SourceParser');

describe('Tokenizer', () => {

  it('should handle spaces correctly', () => {
    // canonical @include form
    expect(SourceParser.parseLine('@include some file'))
      .toEqual({token: SourceParser.tokens.INCLUDE, source: 'some file'});

    // extra spaces between token and value
    expect(SourceParser.parseLine('@include   some file'))
      .toEqual({token: SourceParser.tokens.INCLUDE, source: 'some file'});

    // extra spaces before/after value
    expect(SourceParser.parseLine('@include   some file  '))
      .toEqual({token: SourceParser.tokens.INCLUDE, source: 'some file'});

    // source line, w/o extra spaces
    expect(SourceParser.parseLine('just source line'))
      .toEqual({token: SourceParser.tokens.SOURCE_LINE, line: 'just source line'});

    // source line, with extra spaces (should be preserved)
    expect(SourceParser.parseLine(' just source line  '))
      .toEqual({token: SourceParser.tokens.SOURCE_LINE, line: ' just source line  '});
  });

  it('should break multiline source into correct number of tokens', () => {
    const res = SourceParser.parse('@include abc\nline2\r\nline3\n');
    expect(res).toBeArrayOfObjects();
    expect(res).toBeArrayOfSize(4);
  });

  it('should parse @define correctly', () => {
    const res = SourceParser.parseLine('@define  varname  expression');
    expect(res).toEqual({
      token: SourceParser.tokens.DEFINE,
      varname: 'varname',
      value: 'expression'
    });
  });

  it('should throw error on incorrect @define syntax', () => {
    expect(() => SourceParser.parseLine('@define 1varname  expression'))
      // todo: check for custom error type
      .toThrowAnyError();
  });
});
