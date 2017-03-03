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

  it('should handle context switches', () => {
    const src = `
@macro m1(a, b, c)
  @{a + " " + b + " " + c}
@endmacro
@{a + " " + b + " " + c}
@include m1(11, 22, 33)
@{a + " " + b + " " + c}
`;

    expect(
      machine.execute(src, {
        a: 1, b: 2, c: 3
      })
    ).toBe(`
1 2 3
  11 22 33
1 2 3
`);
  });
});
