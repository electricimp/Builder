/**
 * Spec for AST Parser
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

require('jasmine-expect');

const AstParser = require('../../src/AstParser');

describe('AstParser', () => {
  let p;

  beforeEach(() => {
    p = new AstParser();
  });

  it('should parse include-once #1', () => {
    const e = [
      {
        '_line': 1,
        'type': 'include',
        'value': '"source"',
        'once': false
      },
      {
        '_line': 2,
        'type': 'include',
        'value': 'something',
        'once': true
      }
    ];

    let r;

    r = p.parse(`@include "source"\n@include once something`);
    expect(r).toEqual(e);

    r = p.parse(`@include "source"\n@include   once something`);
    expect(r).toEqual(e);

    r = p.parse(`@include "source"\n@include once  something `);
    expect(r).toEqual(e);

    // console.error(JSON.stringify(r, null, '  ').replace(/\'/g, '\''));
  });

  it('should fail on incorrect include-once syntax', () => {
    try {
      p.parse(`@include "source"\n@include once`);
      fail();
    } catch (e) {
      expect(e instanceof AstParser.Errors.SyntaxError).toBeTruthy();
      expect(e.message).toEqual('Syntax error in @include (main:2)');
    }
  });

});
