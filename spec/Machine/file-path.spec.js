/**
 * Spec for Machine
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

require('jasmine-expect');
const path = require('path');
const init = require('./init')('main');

describe('Machine', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
  });

  it('should generate correct __FILE__/__PATH__ #1', () => {
    machine.path = 'some/path/to';
    machine.file = 'file.ext';

    const res = machine.execute(
`@macro A()
@{__PATH__}#@{__FILE__}@@{__LINE__}
@end
@{__PATH__}#@{__FILE__}@@{__LINE__}
@include A()`);

    expect(res).toEqual(`some/path/to#file.ext@4\nsome/path/to#file.ext@2\n`);
  });

  it('should generate correct __FILE__/__PATH__ #2', () => {
    machine.file = '';
    const res = machine.execute(`@{__PATH__}#@{__FILE__}@@{__LINE__}`);
    expect(res).toEqual(`#@1`);
  });

  it('should generate correct __FILE__/__PATH__ #3', () => {
    machine.file = '';
    const res = machine.execute(`@{__PATH__}#@{__FILE__}@@{__LINE__}
      @include "${__dirname}/../fixtures/lib/path.builder"`);
    // __PATH__ should be absolute (when possible), normalized one
    expect(res).toEqual(`#@1\n${path.normalize(__dirname + '/../fixtures/lib')}#path.builder@1\n`);
  });
});
