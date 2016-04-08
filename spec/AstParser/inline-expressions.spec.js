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

  it('should detect inline expressions', () => {
    const r = p.parse(
      `// main 1
// main 2 @{expr1} @{}
`
    );

    expect(r).toEqual(
      [
        {
          '_line': 1,
          'type': 'output',
          'value': '// main 1\n',
          'computed': true
        },
        {
          '_line': 2,
          'type': 'output',
          'value': '// main 2 ',
          'computed': true
        },
        {
          '_line': 2,
          'type': 'output',
          'value': 'expr1',
          'computed': false
        },
        {
          '_line': 2,
          'type': 'output',
          'value': ' ',
          'computed': true
        },
        {
          '_line': 2,
          'type': 'output',
          'value': '',
          'computed': false
        },
        {
          '_line': 2,
          'type': 'output',
          'value': '\n',
          'computed': true
        }
      ]
    );

    // console.error(JSON.stringify(r, null, '    ').replace(/\"/g, '\''));
  });
});
