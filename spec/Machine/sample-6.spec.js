// Copyright (c) 2016-2020 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');
const fs = require('fs');
const Machine = require('../../src/Machine');
const path = require('path');

const FILE = __dirname + '/../fixtures/sample-6/a.nut';
const init = require('./init')(FILE);
const contextPath = path.dirname(FILE).replace(/\\/g, '/');
const filePath = path.join(contextPath, 'b.nut');

describe('Machine', () => {
  let machine, src;

  beforeEach(() => {
    machine = init.createMachine();
    machine.file = FILE;
    src = fs.readFileSync(FILE, 'utf-8');
  });

  it('should detect cyclic inclusions', () => {
    try {
      machine.execute(src);
    } catch (e) {
      expect(e instanceof Machine.Errors.MaxExecutionDepthReachedError).toBeTruthy();
      expect(e.message).toBe('Maximum execution depth reached, possible cyclic reference? (' + filePath + ':1)');
    }
  });
});
