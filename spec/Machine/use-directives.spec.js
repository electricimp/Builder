// Copyright (c) 2016-2019 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');

const fs = require('fs');
const path = require('path');
const init = require('./init')('main');
const eol = require('eol');

const directivesPath = path.join(process.cwd(), 'directives.json');

describe('Machine', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
  });

  it('Create and read directives.json file', () => {
    const directives = {
      IntType: 34,
      FloatType: 34.456,
      ExponentType1: 3E4,
      ExponentType2: 3e-2,
      StringType1: "str1",
      StringType2: "\"str2\"",
      BoolTypeTrue: true,
      BoolTypeFalse: false,
      NullType: null
    };

    const directivesSource = "@{IntType} @{FloatType} @{ExponentType1} @{ExponentType2} @{StringType1} @{StringType2} @{BoolTypeTrue} @{BoolTypeFalse} @{NullType}";
    const expectedOutput = `34 34.456 30000 0.03 str1 "str2" true false null`;

    // ensure that test directives.json file does not exist
    if (fs.existsSync(directivesPath)) {
      fs.unlinkSync(directivesPath);
    }

    // create directives file
    machine.useDirectives = true;
    expect(eol.lf(machine.execute(directivesSource, directives))).toBe(expectedOutput);

    // check that directives.json file was created
    if (!fs.existsSync(directivesPath)) {
      fail(`The ${directivesPath} file does not exist.`);
    }

    // check that we are able to read variables definitions from json file
    expect(eol.lf(machine.execute(directivesSource))).toBe(expectedOutput);

    // unlink directives file to avoid conflicts with unit-tests below
    fs.unlinkSync(directivesPath);
  });

  it('Check that directives.json file content is able to be merged with additional variable definitions', () => {
    const directives = {
      Int0: 990,
      Int1: 991,
    };
  
    const directivesSource = "@{Int0} @{Int1}";
    const expectedOutput = `990 991`;

    // ensure that test directives.json file does not exist
    if (fs.existsSync(directivesPath)) {
      fs.unlinkSync(directivesPath);
    }

    // create directives file
    machine.useDirectives = true;
    expect(eol.lf(machine.execute(directivesSource, directives))).toBe(expectedOutput);

    // check that directives.json file was created
    if (!fs.existsSync(directivesPath)) {
      fail(`The ${directivesPath} file does not exist.`);
    }

    // check that we are able to read variables definitions from json file
    expect(eol.lf(machine.execute(directivesSource + " @{Int2}", {Int2: 992}))).toBe(expectedOutput + " 992");

    // unlink directives file to avoid conflicts with unit-tests below
    fs.unlinkSync(directivesPath);
  });

  it('Check case when directives.json file appear to be corrupted', () => {
    const directives = {
      Int0: 550,
      Int1: 551,
      Int2: 552,
    };
  
    const directivesSource = "@{Int0} @{Int1} @{Int2}";
    const expectedOutput = `550 551 552`;

    // ensure that test directives.json file does not exist
    if (fs.existsSync(directivesPath)) {
      fs.unlinkSync(directivesPath);
    }

    // create directives file
    machine.useDirectives = true;
    expect(eol.lf(machine.execute(directivesSource, directives))).toBe(expectedOutput);

    // check that directives.json file was created
    if (!fs.existsSync(directivesPath)) {
      fail(`The ${directivesPath} file does not exist.`);
    }

    // corrupt the file
    fs.appendFileSync(directivesPath, ']');

    const fileCorruptedMessage = 'The directives.json file cannot be used: Unexpected token ] in JSON at position 47';

    // check exception error message
    try {
      eol.lf(machine.execute(directivesSource, directives));
    } catch (e) {
      expect(e.message).toEqual(fileCorruptedMessage);
    }

    // unlink directives file to avoid conflicts with unit-tests below
    fs.unlinkSync(directivesPath);
  });
});