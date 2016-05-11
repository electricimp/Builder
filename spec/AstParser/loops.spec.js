/**
 * Spec for AST Parser
 * @author Mikhail Yurasov <me@yurasov.me>
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
        'while': 'something',
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
        'repeat': '15',
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
@endrepeat`
);
    expect(r).toEqual(e);
    // console.error(JSON.stringify(r, null, '  ').replace(/\'/g, '\''));
  });

});
