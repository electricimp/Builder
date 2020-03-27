// Copyright (c) 2016-2020 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');

const eol = require('eol');
const init = require('./init')('main');
const backslashToSlash = require('../backslashToSlash');

const githubPathA = 'github:electricimp/Builder/spec/fixtures/sample-1/inc-a.nut';
const githubPathB = 'github:electricimp/Builder/spec/fixtures/sample-2/inc-c.nut';

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
      expect(backslashToSlash(e.message)).toEqual(fileNotFoundMessage);
    }

    // check respect-local-includes feature
    machine.remoteRelativeIncludes = true;
    const res = eol.lf(machine.execute(`@include once "${githubPathA}"`));
    expect(res).toEqual('// included file a\n// included file b\n');
  });

  it('check that include once directive makes distinguish between local and github files', () => {
    machine.remoteRelativeIncludes = true;
    const res = eol.lf(machine.execute(`@include once "${backslashToSlash(__dirname)}/../fixtures/sample-1/inc-a.nut"
@include once "${githubPathB}"`));
    expect(res).toEqual('// included file a\n// included file b\n// inc-b.nut:1 # inc-b.nut:1\n');
  });
});
