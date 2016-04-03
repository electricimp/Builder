/**
 * Spec for AST Parser
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

require('jasmine-expect');

const AstParser = require('../src/AstParser');

describe('AstParser', () => {
  let p;

  beforeEach(() => {
    p = new AstParser();
    p.file = '__spec__';
  });

  it('should do something alright', () => {
    const r = p.parse(
`// main 1
@if 1
// then:1
@else
// else:1
@endif
// main (last)`
    );

    console.error(JSON.stringify(r, null, '    '));
  });
});
