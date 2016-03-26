/**
 * Spec for Tokenizer
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

const Tokenizer = require('../src/Tokenizer');

describe('Tokenizer', () => {
  beforeEach(() => {
  });

  it('should handle spaces correctly', () => {
    // canonical @include form
    expect(Tokenizer.tokenizeLine('@include some file'))
      .toEqual({token: Tokenizer.TOKENS.T_INCLUDE, value: 'some file'});

    // extra spaces between token and value
    expect(Tokenizer.tokenizeLine('@include   some file'))
      .toEqual({token: Tokenizer.TOKENS.T_INCLUDE, value: 'some file'});

    // extra spaces before/after value
    expect(Tokenizer.tokenizeLine('@include   some file  '))
      .toEqual({token: Tokenizer.TOKENS.T_INCLUDE, value: 'some file'});

    // source line, w/o extra spaces
    expect(Tokenizer.tokenizeLine('just source line'))
      .toEqual({token: Tokenizer.TOKENS.T_SOURCE_LINE, value: 'just source line'});

    // source line, with extra spaces (should be preserved)
    expect(Tokenizer.tokenizeLine(' just source line  '))
      .toEqual({token: Tokenizer.TOKENS.T_SOURCE_LINE, value: ' just source line  '});
  });

});
