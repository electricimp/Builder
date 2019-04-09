// Copyright (c) 2016-2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');
const init = require('./init')('main');

describe('Machine', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
  });

  it('should handle @while corectly #1', () => {
    const res = machine.execute(
      `
@set a = 3
@while a > 0
loop.index == @{loop.index}
a == @{a}
@set a = a - 1
@end
`
    );

    expect(res).toEqual(
      `
loop.index == 0
a == 3
loop.index == 1
a == 2
loop.index == 2
a == 1
`
    );
  });

  it('shold handle @repeat loops correctly #1', () => {

    const res = machine.execute(
      `
@repeat 3
loop.index == @{loop.index}
loop.iteration == @{loop.iteration}
@end
`
    );

    expect(res).toEqual(
      `
loop.index == 0
loop.iteration == 1
loop.index == 1
loop.iteration == 2
loop.index == 2
loop.iteration == 3
`
    );

  });

  it('should handle @while within @repeat corectly #1', () => {
    const res = machine.execute(
      `
@repeat 3
  @set a = loop.iteration
  @while a > 0
    loop.iteration == @{loop.iteration}
    @set a = a - 1
  @end
@end
`
    );

    expect(res).toEqual(
`
    loop.iteration == 1
    loop.iteration == 1
    loop.iteration == 2
    loop.iteration == 1
    loop.iteration == 2
    loop.iteration == 3
`
    );
  });
});
