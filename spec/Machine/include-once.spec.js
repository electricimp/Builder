// Copyright (c) 2016-2020 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');
const init = require('./init')('main');
const eol = require('eol');
const backslashToSlash = require('../backslashToSlash');

describe('Machine', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
  });

  it('should handle include-once corectly #1', () => {
    const res = eol.lf(machine.execute(
      `@include "${backslashToSlash(__dirname)}/../fixtures/lib/a.builder"
@include once "${backslashToSlash(__dirname)}/../fixtures/lib/b.builder"
@include once "${backslashToSlash(__dirname)}/../fixtures/lib/a.builder"
@include once "${backslashToSlash(__dirname)}/../fixtures/lib/b.builder"
@include once "${backslashToSlash(__dirname)}/../fixtures/lib/c.builder"`
    ));
    expect(res).toEqual(`a.builder\nb.builder\nc.builder\n`);
  });

  it('should handle include-once corectly #2', () => {
    const res = machine.execute(
      `@include once "github:electricimp/Builder/spec/fixtures/lib/path.builder@v0.2.0"
@include once "github:electricimp/Builder/spec/fixtures/lib/path.builder@v0.2.0"`
    );
    expect(res).toEqual(`github:electricimp/Builder/spec/fixtures/lib#path.builder@1\n`);
  });

  it('should handle include-once corectly #3', () => {
    machine.suppressDupWarning = false;
    const res = eol.lf(machine.execute(
      `@include once "${backslashToSlash(__dirname)}/../fixtures/lib/a.builder"
@include once "${backslashToSlash(__dirname)}/../fixtures/lib/a.builder_copy"`
    ));
    expect(res).toEqual(`a.builder\n`);
  });
});
