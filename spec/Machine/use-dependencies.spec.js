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

const dependenciesUseFile = path.join(process.cwd(), 'use_dependencies.json');
const dependenciesSaveFile = path.join(process.cwd(), 'save_dependencies.json');

describe('Machine', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
  });

  it('Create and read dependencies JSON file', () => {
    const rev1GitBlobID = "c22db87f08ae30a4a0d3450daabb34029b3d50e7";
    const rev1Content = "// included file a\n// included file b\n\n\n  // should be included\n\n    // l2 else\n\n\n  // should be included\n";
    const rev0GitBlobID = "9db26aa9017943a7812ab6751a699cd1c7247370";
    const rev0Content = "// included file a\n    // included file b\n\n\n      // should be included\n\n        // l2 else\n\n\n      // should be included\n";
    const url = 'github:electricimp/Builder/spec/fixtures/sample-1/input.nut.out';

    // ensure that test dependencies JSON file does not exist
    if (fs.existsSync(dependenciesSaveFile)) {
      fs.unlinkSync(dependenciesSaveFile);
    }

    machine.dependenciesSaveFile = dependenciesSaveFile;
    expect(eol.lf(machine.execute(`@include "${url}"`))).toBe(rev1Content);

    // check dependencies JSON file content
    const rev1Map = new Map(JSON.parse(fs.readFileSync(dependenciesSaveFile)));
    expect(rev1Map.size).toEqual(1);
    expect(rev1Map.get(url)).toEqual(rev1GitBlobID);

    // replace the actual commit ID to previous
    rev1Map.set(url, rev0GitBlobID);
    fs.writeFileSync(dependenciesSaveFile, JSON.stringify([...rev1Map], null, 2), 'utf-8');

    machine.dependenciesUseFile = dependenciesSaveFile;
    expect(eol.lf(machine.execute(`@include "${url}"`))).toBe(rev0Content);

    // check dependencies JSON file content again
    const rev0Map = new Map(JSON.parse(fs.readFileSync(dependenciesSaveFile)));
    expect(rev0Map.size).toEqual(1);
    expect(rev0Map.get(url)).toEqual(rev0GitBlobID);

    // unlink dependencies file to avoid conflicts with unit-tests below
    fs.unlinkSync(dependenciesSaveFile);
  });

  it('Check dependencies JSON if github ref already provided', () => {
    const rev0GitBlobID = "9db26aa9017943a7812ab6751a699cd1c7247370";
    const rev0CommitID = "e2a5b434b34b5737b2ff52f51a92c5bbcc9f83bf";
    const rev0Content = "// included file a\n    // included file b\n\n\n      // should be included\n\n        // l2 else\n\n\n      // should be included\n";
    const url = `github:electricimp/Builder/spec/fixtures/sample-1/input.nut.out@${rev0CommitID}`;

    // ensure that test dependencies JSON file does not exist
    if (fs.existsSync(dependenciesSaveFile)) {
      fs.unlinkSync(dependenciesSaveFile);
    }

    machine.dependenciesSaveFile = dependenciesSaveFile;
    expect(eol.lf(machine.execute(`@include "${url}"`))).toBe(rev0Content);

    // check dependencies JSON file content again
    const rev0Map = new Map(JSON.parse(fs.readFileSync(dependenciesSaveFile)));
    expect(rev0Map.size).toEqual(1);
    expect(rev0Map.get(url)).toEqual(rev0GitBlobID);

    // unlink dependencies file to avoid conflicts with unit-tests below
    fs.unlinkSync(dependenciesSaveFile);
  });

  it('Check ---save-dependecies/--use-dependencies options combination', () => {
    const rev1Content = "// included file a\n// included file b\n\n\n  // should be included\n\n    // l2 else\n\n\n  // should be included\n";
    const url = `github:electricimp/Builder/spec/fixtures/sample-1/input.nut.out`;

    // ensure that test dependencies JSON file does not exist
    if (fs.existsSync(dependenciesUseFile)) {
      fs.unlinkSync(dependenciesUseFile);
    }

    machine.dependenciesSaveFile = dependenciesUseFile;
    expect(eol.lf(machine.execute(`@include "${url}"`))).toBe(rev1Content);

    // check that dependencies JSON file was created
    if (!fs.existsSync(dependenciesUseFile)) {
      fail(`The ${dependenciesUseFile} file does not exist.`);
    }

    machine.dependenciesUseFile = dependenciesUseFile;
    machine.dependenciesSaveFile = dependenciesSaveFile;
    expect(eol.lf(machine.execute(`@include "${url}"`))).toBe(rev1Content);

    // check that dependencies JSON file was created
    if (!fs.existsSync(dependenciesSaveFile)) {
      fail(`The ${dependenciesSaveFile} file does not exist.`);
    }

    // check that files are identical
    expect(fs.readFileSync(dependenciesUseFile)).toEqual(fs.readFileSync(dependenciesSaveFile));

    // unlink directives file to avoid conflicts with unit-tests below
    fs.unlinkSync(dependenciesSaveFile);
    fs.unlinkSync(dependenciesUseFile);
  });

  it('Check case when dependencies JSON file is corrupted', () => {
    const rev1Content = "// included file a\n// included file b\n\n\n  // should be included\n\n    // l2 else\n\n\n  // should be included\n";
    const url = `github:electricimp/Builder/spec/fixtures/sample-1/input.nut.out`;

    // ensure that test dependencies JSON file does not exist
    if (fs.existsSync(dependenciesSaveFile)) {
      fs.unlinkSync(dependenciesSaveFile);
    }

    machine.dependenciesSaveFile = dependenciesSaveFile;
    expect(eol.lf(machine.execute(`@include "${url}"`))).toBe(rev1Content);

    // Check dependencies JSON file content again
    const rev0Map = new Map(JSON.parse(fs.readFileSync(dependenciesSaveFile)));
    expect(rev0Map.size).toEqual(1);

    // corrupt the file
    fs.appendFileSync(dependenciesSaveFile, ']');

    const fileCorruptedMessage = `The dependencies JSON file '${dependenciesSaveFile}' cannot be used`;

    // check exception error message
    try {
      machine.dependenciesUseFile = dependenciesSaveFile;
      expect(eol.lf(machine.execute(`@include "${url}"`))).toBe(rev1Content);
    } catch (e) {
      expect(e.message).toStartWith(fileCorruptedMessage);
    }

    // unlink directives file to avoid conflicts with unit-tests below
    fs.unlinkSync(dependenciesSaveFile);
  });
});
