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
    const r = p.parse(`line 1\n@@ comment\nline 3`);
    console.error(JSON.stringify(r, null, '    ').replace(/\"/g, '\''));
  });
});
