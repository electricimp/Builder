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
        'type': 'loop',
        'test': 'something',
        'body': [
          {
            '_line': 2,
            'type': 'output',
            'value': '...\n',
            'computed': true
          }
        ]
      }
    ];

    let r;

    r = p.parse(
`@while something
...
@endwhile`
);
    expect(r).toEqual(e);
    // console.error(JSON.stringify(r, null, '  ').replace(/\'/g, '\''));
  });
  it('should parse include-once #1', () => {
    const e = [
      {
        '_line': 1,
        'type': 'loop',
        'test': 'something',
        'body': [
          {
            '_line': 2,
            'type': 'output',
            'value': '...\n',
            'computed': true
          }
        ]
      }
    ];

    let r;

    r = p.parse(
`@repeat 15
...
@endwhile`
);
    // expect(r).toEqual(e);
    console.error(JSON.stringify(r, null, '  ').replace(/\'/g, '\''));
  });

  // it('should fail on incorrect include-once syntax', () => {
  //   try {
  //     p.parse(`@include "source"\n@include once`);
  //     fail();
  //   } catch (e) {
  //     expect(e instanceof AstParser.Errors.SyntaxError).toBeTruthy();
  //     expect(e.message).toEqual('Syntax error in @include (main:2)');
  //   }
  // });

});
