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

  it('should handle @-style comments', () => {
    const r = p.parse(`line\n@ comment\n@\n@noncomment\n@@\n  @\t\nline`);
    // console.error(JSON.stringify(r, null, '    ').replace(/\"/g, '\''));
    expect(r).toEqual([
      {
        '_line': 1,
        'type': 'output',
        'value': 'line\n',
        'computed': true
      },
      {
        '_line': 4,
        'type': 'output',
        'value': '@noncomment\n',
        'computed': true
      },
      {
        '_line': 5,
        'type': 'output',
        'value': '@@\n',
        'computed': true
      },
      {
        '_line': 7,
        'type': 'output',
        'value': 'line',
        'computed': true
      }
    ]);
  });
});
