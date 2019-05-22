// Copyright (c) 2016-2019 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');

const eol = require('eol');
const init = require('./init')('main');

const githubPath = 'github:electricimp/Builder/spec/fixtures/sample-17/lib/lib.nut';

describe('Machine', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
  });

  it('check that single file will be included from github', () => {
    const includesMsg = '\n\n\n\n\n\n\nlocal str = "lib.nut level 1";\n';
    machine.remoteRelativeIncludes = true;
    const res = eol.lf(machine.execute(`@include once "${githubPath}"`));
    expect(res).toEqual(includesMsg);
  });

  it('test POSIX compatible relative includes', () => {
    const includesMsg = `    "==== USE_INCLUDES BEGIN ===="
local str = "I AM libDependency.nut level 2";
local str = "I AM libDependency.nut level 1";
local str = "I AM libDependency.nut level 0";
local str = "I AM libDependency.nut out of tree level 1";
local str = "I AM libDependency.nut out of tree level 2";
local str = "I AM libDependency1.nut out of tree level 1";
    "==== USE_INCLUDES END ======"\n\n\n\n\n\n\n\nlocal str = "lib.nut level 1";\n`;

    machine.remoteRelativeIncludes = true;
    const define = { USE_INCLUDES: 'TRUE' };
    const res = eol.lf(machine.execute(`@include once "${githubPath}"`, define));
    expect(res).toEqual(includesMsg);
  });

  it('test Windows compatible relative includes', () => {
    const includesMsg = `
    "==== USE_WIN_INCLUDES BEGIN ===="
local str = "I AM libDependency.nut level 2";
local str = "I AM libDependency.nut level 1";
local str = "I AM libDependency.nut level 0";
local str = "I AM libDependency.nut out of tree level 1";
local str = "I AM libDependency.nut out of tree level 2";
local str = "I AM libDependency1.nut out of tree level 1";
    "==== USE_WIN_INCLUDES END ======"\n\n\n\n\n\n\nlocal str = "lib.nut level 1";\n`;

    machine.remoteRelativeIncludes = true;
    const define = { USE_WIN_INCLUDES: 'TRUE' };
    const res = eol.lf(machine.execute(`@include once "${githubPath}"`, define));
    expect(res).toEqual(includesMsg);
  });

  /*
   * The support of another fixtures defines, like:
   *  USE_ABSOLUTE_INCLUDES
   *  USE_WIN_ABSOLUTE_INCLUDES
   *  INCLUDE_NOT_EXIST
   *  INCLUDE_NOT_EXIST_ERROR
   *  INCLUDE_OUT_OF_REPO_ERROR
   * will be added in the future.
   */
});
