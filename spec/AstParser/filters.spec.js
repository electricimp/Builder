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

  it('should parse filter in inline expressions #1', () => {
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
`@{expression|filter1|filter2}`
);
    
    // expect(r).toEqual(e);
    console.error(JSON.stringify(r, null, '  ').replace(/\'/g, '\''));
  });

});
