// Copyright (c) 2016-2019 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');
const path = require('path');
const eol = require('eol');
const init = require('./init')('main');

const backslashToSlash = require('../backslashToSlash');

describe('Machine', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
  });

  it('should generate correct __FILE__/__PATH__ #1', () => {
    machine.path = 'some/path/to';
    machine.file = 'file.ext';

    const res = eol.lf(machine.execute(
`@macro A()
@{__PATH__}#@{__FILE__}@@{__LINE__}
@end
@{__PATH__}#@{__FILE__}@@{__LINE__}
@include A()`));

    expect(res).toEqual(`some/path/to#file.ext@4\nsome/path/to#file.ext@2\n`);
  });

  it('should generate correct __FILE__/__PATH__ #2', () => {
    machine.file = '';
    const res = machine.execute(`@{__PATH__}#@{__FILE__}@@{__LINE__}`);
    expect(res).toEqual(`#@1`);
  });

  it('should generate correct __FILE__/__PATH__ #3', () => {
    machine.file = '';
    const res = eol.lf(machine.execute(`@{__PATH__}#@{__FILE__}@@{__LINE__}
      @include "${backslashToSlash(__dirname)}/../fixtures/lib/path.builder"`));
    // __PATH__ should be absolute (when possible), normalized one
    expect(res).toEqual(`#@1\n${path.normalize(__dirname + '/../fixtures/lib')}#path.builder@1\n`);
  });
});
