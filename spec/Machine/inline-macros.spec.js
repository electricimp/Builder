/**
 * Spec for Machine
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

require('jasmine-expect');

const init = require('./init')('main');
const jasmineDiffMatchers = require('jasmine-diff-matchers');

describe('Machine', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
    // show string diffs
    jasmine.addMatchers(jasmineDiffMatchers.diffChars);
  });

  it('should handle inline macro inclusion', () => {

    machine.generateLineControlStatements = true;

    const res = machine.execute(`
@macro A()
A.1 // @{__FILE__}:@{__LINE__}
A.2 // @{__FILE__}:@{__LINE__}
@end
-~=[@{A(1,2,3)}]=~-
@include A()
    `.trim());

    expect(res).diffChars(`#line 5 "main"
-~=[A.1 // main:2
A.2 // main:3]=~-
A.1 // main:2
A.2 // main:3
`);

  });
});
