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

  it('should handle @@-style comments', () => {
    const r = p.parse(`line 1\n@@ comment\n@@\nline 4`);
    // console.error(JSON.stringify(r, null, '    ').replace(/\"/g, '\''));
    expect(r).toEqual([
      {
        '_line': 1,
        'type': 'output',
        'value': 'line 1\n',
        'computed': true
      },
      {
        '_line': 4,
        'type': 'output',
        'value': 'line 4',
        'computed': true
      }
    ]);
  });
});
