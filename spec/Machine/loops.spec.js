/**
 * Spec for Machine
 * @author Mikhail Yurasov <mikhail@electricimp.com>
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

  it('should handle @while corectly #1', () => {
    const res = machine.execute(
      `
@set a = 3
@while a > 0
__INDEX___ == @{__INDEX__}
a == @{a}
@set a = a - 1
@end
`
    );

    expect(res).diffChars(
      `
__INDEX___ == 0
a == 3
__INDEX___ == 1
a == 2
__INDEX___ == 2
a == 1
`
    );
  });

  it('shold handle @repeat loops correctly #1', () => {

    const res = machine.execute(
      `
@repeat 3
__INDEX___ == @{__INDEX__}
@end
`
    );

    expect(res).diffChars(
      `
__INDEX___ == 0
__INDEX___ == 1
__INDEX___ == 2
`
    );

  });
});
