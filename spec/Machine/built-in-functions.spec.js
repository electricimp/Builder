// Copyright (c) 2016-2019 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');
const init = require('./init')('main');
const Machine = require('../../src/Machine');

const backslashToSlash = require('../backslashToSlash');

describe('Machine', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
  });

  it('should handle built-in function include()', () => {
    const res = machine.execute(
      `@{include('${backslashToSlash(__dirname) + '/../fixtures/lib/d.builder'}')|escape}`
    );
    // eol normalize \r\n at end of line only. Replace \r\n inside line.
    expect(res.replace('\\r\\n','\\n')).toEqual(`d.builder\\nd.builder:2`);
  });

  it('should handle errors in include() calls', () => {
    try {
      machine.execute(`\n@{include()}`);
      fail();
    } catch (e) {
      expect(e instanceof Machine.Errors.ExpressionEvaluationError).toBe(true);
      expect(e.message).toBe('Wrong number of arguments for include() (main:2)');
    }
  });

  it('should add more paths for local include file searching', () => {
    const dirname = __dirname;
    process.chdir(__dirname + "/../fixtures/sample-10/1");
    let context = { __PATH__ : "/../2/3" };
    const res = machine.execute(
      `@include "inc-e.nut"`,
      context
    );
    // eol normalize \r\n at end of line only. Replace \r\n inside line.
    expect(res).toEqual(`more paths for include file searching\n`);
    process.chdir(dirname);
  });
});
