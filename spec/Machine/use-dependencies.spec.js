// Copyright (c) 2016-2019 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');

const fs = require('fs');
const path = require('path');
const Fixture = require('fixture-stdout');
const stderrFixture = new Fixture({ stream: process.stderr });
const init = require('./init')('main');
const eol = require('eol');
const backslashToSlash = require('../backslashToSlash');

const dependenciesPath = path.join(process.cwd(), 'dependencies.json');

describe('Machine', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
  });

  it('Create and read dependencies.json file', () => {
    const rev1CommitID = "e66123ec55a185e2b599e759ceb2e1945fc1bb66";
    const rev1Content = "// included file a\n// included file b\n\n\n  // should be included\n\n    // l2 else\n\n\n  // should be included\n";
    const rev0CommitID = "e2a5b434b34b5737b2ff52f51a92c5bbcc9f83bf";
    const rev0Content = "// included file a\n    // included file b\n\n\n      // should be included\n\n        // l2 else\n\n\n      // should be included\n";
    const url = 'github:nobitlost/Builder/spec/fixtures/sample-1/input.nut.out';

    // ensure that test dependencies.json file does not exist
    if (fs.existsSync(dependenciesPath)) {
      fs.unlinkSync(dependenciesPath);
    }

    machine.useDependencies = true;
    expect(eol.lf(machine.execute(`@include "${url}"`))).toBe(rev1Content);

    // check dependencies.json file content
    const rev1Map = new Map(JSON.parse(fs.readFileSync(dependenciesPath)));
    expect(rev1Map.size).toEqual(1);
    expect(rev1Map.get(url)).toEqual(rev1CommitID);

    // replace the actual commit ID to previous
    rev1Map.set(url, rev0CommitID);
    fs.writeFileSync(dependenciesPath, JSON.stringify([...rev1Map], null, 2), 'utf-8');

    machine.useDependencies = true;
    expect(machine.fileCache._fillDependencies).toBe(false);
    expect(eol.lf(machine.execute(`@include "${url}"`))).toBe(rev0Content);

    // check dependencies.json file content again
    const rev0Map = new Map(JSON.parse(fs.readFileSync(dependenciesPath)));
    expect(rev0Map.size).toEqual(1);
    expect(rev0Map.get(url)).toEqual(rev0CommitID);

    // unlink dependencies file to avoid conflicts with unit-tests below
    fs.unlinkSync(dependenciesPath);
  });

  it('Do not add github url to dependencies.json if github ref already provided', () => {
    const rev0CommitID = "e2a5b434b34b5737b2ff52f51a92c5bbcc9f83bf";
    const rev0Content = "// included file a\n    // included file b\n\n\n      // should be included\n\n        // l2 else\n\n\n      // should be included\n";
    const url = `github:nobitlost/Builder/spec/fixtures/sample-1/input.nut.out@${rev0CommitID}`;

    // ensure that test dependencies.json file does not exist
    if (fs.existsSync(dependenciesPath)) {
      fs.unlinkSync(dependenciesPath);
    }

    machine.useDependencies = true;
    expect(machine.fileCache._fillDependencies).toBe(true);
    expect(eol.lf(machine.execute(`@include "${url}"`))).toBe(rev0Content);

    // check dependencies.json file content again
    const rev0Map = new Map(JSON.parse(fs.readFileSync(dependenciesPath)));
    expect(rev0Map.size).toEqual(0);
  });

  it('Check case when dependencies.json file is corrupted', () => {
    const rev1Content = "// included file a\n// included file b\n\n\n  // should be included\n\n    // l2 else\n\n\n  // should be included\n";
    const url = `github:nobitlost/Builder/spec/fixtures/sample-1/input.nut.out`;

    // ensure that test dependencies.json file does not exist
    if (fs.existsSync(dependenciesPath)) {
      fs.unlinkSync(dependenciesPath);
    }

    machine.useDependencies = true;
    expect(machine.fileCache._fillDependencies).toBe(true);
    expect(eol.lf(machine.execute(`@include "${url}"`))).toBe(rev1Content);

    // Check dependencies.json file content again
    const rev0Map = new Map(JSON.parse(fs.readFileSync(dependenciesPath)));
    expect(rev0Map.size).toEqual(1);

    // corrupt the file
    fs.appendFileSync(dependenciesPath, ']');

    const fileCorruptedMessage = 'The dependencies.json file cannot be used: Unexpected token ] in JSON at position 127';

    // check exception error message
    try {
      machine.useDependencies = true;
      expect(machine.fileCache._fillDependencies).toBe(false);
      expect(eol.lf(machine.execute(`@include "${url}"`))).toBe(rev1Content);
    } catch (e) {
      expect(e.message).toEqual(fileCorruptedMessage);
    }

    // unlink directives file to avoid conflicts with unit-tests below
    fs.unlinkSync(dependenciesPath);
  });
});