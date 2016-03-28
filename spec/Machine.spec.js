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

  const machine = new Machine();
  machine.localFileReader = new LocalFileReader();
  machine.sourceParser = new SourceParser();

  it('should do alright #1', () => {

    // prepare instructions
    const content = fs.readFileSync(__dirname + '/fixtures/sample-1/input.nut', 'utf-8');
    machine.sourceParser.sourceName = 'input.nut';
    const instructions = machine.sourceParser.parse(content);

    // set search dirs
    machine.localFileReader.searchDirs = [
      __dirname + '/fixtures/sample-1'
    ];

    machine.instructions = instructions;
    const res = machine.excecute();

    console.log(res);
  });

});
