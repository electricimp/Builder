/**
 * Builder VM spec
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

require('jasmine-expect');

const fs = require('fs');
const Machine = require('../src/Machine');
const SourceParser = require('../src/SourceParser');
const LocalFileReader = require('../src/LocalFileReader');

describe('Machine', () => {

  const localFileReader = new LocalFileReader();
  const machine = new Machine();
  machine.localFileReader = localFileReader;
  const parser = new SourceParser();

  it('should do alright #1', () => {

    // prepare instructions
    const content = fs.readFileSync(__dirname + '/fixtures/sample-1/input.nut', 'utf-8');
    const instructions = parser.parse(content);

    // set search dirs
    localFileReader.searchDirs = [
      __dirname + '/fixtures/sample-1'
    ];

    machine.instructions = instructions;
    const res = machine.excecute();

    console.log(res);
  });

});
