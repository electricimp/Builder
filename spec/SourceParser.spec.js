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

  it('should break multiline source into correct number of tokens', () => {
    const res = parser.parse('@include abc\nline2\r\nline3\n');
    expect(res).toBeArrayOfObjects();
    expect(res).toBeArrayOfSize(4);
  });

  it('should handle spaces correctly', () => {
    // canonical @include form
    expect(parser.parse('@include some file')[0])
      .toEqual({
        _line: 1,
        _source: 'test',
        token: SourceParser.tokens.INCLUDE,
        source: 'some file'
      });

    // extra spaces between token and value
    expect(parser.parse('@include   some file')[0])
      .toEqual({
        _line: 1,
        _source: 'test',
        token: SourceParser.tokens.INCLUDE,
        source: 'some file'
      });

    // extra spaces before/after value
    expect(parser.parse('@include   some file  ')[0])
      .toEqual({
        _line: 1,
        _source: 'test',
        token: SourceParser.tokens.INCLUDE,
        source: 'some file'
      });

    // source line, w/o extra spaces
    expect(parser.parse('just source line')[0])
      .toEqual({
        _line: 1,
        _source: 'test',
        token: SourceParser.tokens.SOURCE_LINE,
        line: 'just source line'
      });

    // source line, with extra spaces (should be preserved)
    expect(parser.parse(' just source line  ')[0])
      .toEqual({
        _line: 1,
        _source: 'test',
        token: SourceParser.tokens.SOURCE_LINE,
        line: ' just source line  '
      });
  });

  it('should parse @set correctly', () => {
    const res = parser.parse('@set  varname  expression')[0];
    expect(res).toEqual({
      _line: 1,
      _source: 'test',
      token: SourceParser.tokens.SET,
      variable: 'varname',
      value: 'expression'
    });
  });

  it('should throw error on incorrect @set syntax', () => {
    expect(() => parser.parse('@set 1varname  expression')[0])
    // todo: check for custom error type
      .toThrowAnyError();
  });
});
