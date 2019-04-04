// Copyright (c) 2016-2019 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');

const fs = require('fs');
const init = require('./init')('main');
const eol = require('eol');
const backslashToSlash = require('../backslashToSlash');

const githubPathA = "github:electricimp/Builder/spec/fixtures/sample-1/inc-a.nut"
const incPathB = `${backslashToSlash(__dirname)}/../fixtures/sample-1/inc-b.nut`;
const incBTmpName = "inc-b.nut_bkp";

describe('Machine', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
  });

  it('check that locally included file will be checkouted from github', () => {
    /* 
     * the ../fixtures/sample-1/inc-a.nut will locally include ../fixtures/sample-1/inc.b.nut,
     * rename the inc-b.nut to make it not viewable locally and execute the machine without\with
     * the repect-local-includes option.
     */
    fs.renameSync(incPathB, incBTmpName);
    expect(false).toEqual(fs.existsSync(incPathB));

    const fileNotFoundMessage = 'Local file "inc-b.nut" not found (github:electricimp/Builder/spec/fixtures/sample-1/inc-a.nut:2)';
    try {
      const res = eol.lf(machine.execute(`@include once "${githubPathA}"`));
      expect(res).toEqual(`// included file a\n// included file b\n`);
    } catch (e) {
      expect(e.message).toEqual(fileNotFoundMessage);
    }

    // check respect-local-includes feature
    machine.respectLocalIncludes = true;
    const res = eol.lf(machine.execute(`@include once "${githubPathA}"`));
    expect(res).toEqual(`// included file a\n// included file b\n`);

    // put back the inc-b.nut test file
    fs.renameSync(incBTmpName, incPathB);
    expect(true).toEqual(fs.existsSync(incPathB));
  });
});