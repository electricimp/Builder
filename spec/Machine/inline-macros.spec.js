// Copyright (c) 2016-2020 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');

const init = require('./init')('main');
const path = require('path');

const contextPath = path.resolve(__dirname, './../..').replace(/\\/g, '/');
const filePath = path.join(contextPath, 'main').replace(/\\/g, '/');

describe('Machine', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
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
    `.trim()).split(filePath).join('main');

    expect(res).toEqual(`#line 5 "main"
-~=[A.1 // main:2
A.2 // main:3]=~-
A.1 // main:2
A.2 // main:3
`);

  });
});
