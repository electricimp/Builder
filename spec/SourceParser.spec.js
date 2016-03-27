/**
 * Spec for Tokenizer
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

require('jasmine-expect');

const SourceParser = require('../src/SourceParser');

describe('Tokenizer', () => {

  const parser = new SourceParser();
  parser.sourceName = 'test';

  it('should handle spaces correctly', () => {
    // canonical @include form
    expect(parser.parseLine('@include some file'))
      .toEqual({token: SourceParser.tokens.INCLUDE, source: 'some file'});

    // extra spaces between token and value
    expect(parser.parseLine('@include   some file'))
      .toEqual({token: SourceParser.tokens.INCLUDE, source: 'some file'});

    // extra spaces before/after value
    expect(parser.parseLine('@include   some file  '))
      .toEqual({token: SourceParser.tokens.INCLUDE, source: 'some file'});

    // source line, w/o extra spaces
    expect(parser.parseLine('just source line'))
      .toEqual({token: SourceParser.tokens.SOURCE_LINE, line: 'just source line'});

    // source line, with extra spaces (should be preserved)
    expect(parser.parseLine(' just source line  '))
      .toEqual({token: SourceParser.tokens.SOURCE_LINE, line: ' just source line  '});
  });

  it('should break multiline source into correct number of tokens', () => {
    const res = parser.parse('@include abc\nline2\r\nline3\n');
    expect(res).toBeArrayOfObjects();
    expect(res).toBeArrayOfSize(4);
  });

  it('should parse @set correctly', () => {
    const res = parser.parseLine('@set  varname  expression');
    expect(res).toEqual({
      token: SourceParser.tokens.SET,
      variable: 'varname',
      value: 'expression'
    });
  });

  it('should throw error on incorrect @set syntax', () => {
    expect(() => parser.parseLine('@set 1varname  expression'))
      // todo: check for custom error type
      .toThrowAnyError();
  });
});
