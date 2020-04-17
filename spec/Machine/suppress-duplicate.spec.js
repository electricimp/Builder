// Copyright (c) 2016-2020 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');

const Fixture = require('fixture-stdout');
const stderrFixture = new Fixture({ stream: process.stderr });
const init = require('./init')('main');
const eol = require('eol');
const backslashToSlash = require('../backslashToSlash');

describe('Machine', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
  });

  it('should print included source duplicate warning by default', (done) => {
    // What we expect to be logged to STDERR
    const includePathOriginal = `${backslashToSlash(__dirname)}/../fixtures/lib/a.builder`;
    const includePathDuplicated = `${backslashToSlash(__dirname)}/../fixtures/lib/a.builder_copy`;
    const text = `Warning: duplicated includes detected! The same exact file content is included from
    main:1 (${includePathOriginal})
    main:2 (${includePathDuplicated})`;
    const duplicateWarning = `\x1b[33m${text}\u001b[39m\n`;
    try {
      // Capture STDERR messages
      stderrFixture.capture(message => {
        try {
          expect(message).toBe(duplicateWarning);
          // Release STDERR
          stderrFixture.release();
          done();
        } catch (e) {
          fail(e);
        }
        // Returning false prevents message actually being logged to STDERR
        return false;
      });

      machine.suppressDupWarning = false;
      const res = eol.lf(machine.execute(
        `@include "${backslashToSlash(__dirname)}/../fixtures/lib/a.builder"
@include "${backslashToSlash(__dirname)}/../fixtures/lib/a.builder_copy"`
      ));
      expect(res).toEqual(`a.builder\na.builder\n`);
    } catch (e) {
      fail(e);
    }
  });

  it('should not print included source duplicate warning if requested', () => {
    // The STDERR should be empty
    try {
      // Capture STDERR messages
      stderrFixture.capture(message => {
        fail(`Got message in stderr ${message}`);
        // Returning false prevents message actually being logged to STDERR
        return false;
      });

      const res = eol.lf(machine.execute(
        `@include "${backslashToSlash(__dirname)}/../fixtures/lib/a.builder"
@include "${backslashToSlash(__dirname)}/../fixtures/lib/a.builder_copy"`
      ));
      expect(res).toEqual(`a.builder\na.builder\n`);
    } catch (e) {
      fail(e);
    }
  });
});
