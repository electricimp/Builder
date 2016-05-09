/**
 * Spec for Machine
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

require('jasmine-expect');
const init = require('./init')('main');

describe('Machine', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
  });

  it('should handle include-once corectly #1', () => {
    const res = machine.execute(
`@include "${__dirname}/../fixtures/lib/a.builder"
@include once "${__dirname}/../fixtures/lib/b.builder"
@include once "${__dirname}/../fixtures/lib/a.builder"
@include once "${__dirname}/../fixtures/lib/b.builder"
@include once "${__dirname}/../fixtures/lib/c.builder"`
);
    expect(res).toEqual(`a.builder\nb.builder\nc.builder\n`);
  });

  it('should handle include-once corectly #2', () => {
    const res = machine.execute(
`@include once "github:electricimp/Builder/spec/fixtures/lib/path.builder@v0.2.0"
@include once "github:electricimp/Builder/spec/fixtures/lib/path.builder@v0.2.0"`
    );
    expect(res).toEqual(`github:electricimp/Builder/spec/fixtures/lib#path.builder@1\n`);
  });
});
