// Copyright (c) 2016-2019 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');

const init = require('./init')('main');
const eol = require('eol');

const githubPathA = "github:electricimp/Builder/spec/fixtures/sample-1/inc-a.nut"

describe('Machine', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
  });

  it('check that locally included file will be checkouted from github', () => {
    const fileNotFoundMessage = 'Local file "inc-b.nut" not found (github:electricimp/Builder/spec/fixtures/sample-1/inc-a.nut:2)';
    try {
      eol.lf(machine.execute(`@include once "${githubPathA}"`));
      fail();
    } catch (e) {
      expect(e.message).toEqual(fileNotFoundMessage);
    }

    // check respect-local-includes feature
    machine.respectLocalIncludes = true;
    const res = eol.lf(machine.execute(`@include once "${githubPathA}"`));
    expect(res).toEqual(`// included file a\n// included file b\n`);
  });
});