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
const Expression = require('../src/Expression');
const Log = require('log');

describe('Machine', () => {

  let machine;

  beforeEach(() => {
    // create logger
    // @see https://www.npmjs.com/package/log#log-levels
    const logger = new Log(process.env.SPEC_LOGLEVEL);

    // build the machine
    machine = new Machine();
    machine.localFileReader = new LocalFileReader();
    machine.localFileReader.logger = logger;
    machine.sourceParser = new SourceParser();
    machine.expression = new Expression();
    machine.logger = logger;
  });

  it('should do alright with sample#1', () => {
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

    expect(res).not.toMatch(/should not be included/);
  });

  it('should detect and fail on multi-else statements', () => {
    // prepare instructions
    const content = fs.readFileSync(__dirname + '/fixtures/sample-2/multi-else.nut', 'utf-8');
    machine.sourceParser.sourceName = 'multi-else.nut';
    expect(() => machine.sourceParser.parse(content)).toThrowAnyError();
  });

  it('should detect and fail on unbalanced if statements', () => {
    // prepare instructions
    const content = fs.readFileSync(__dirname + '/fixtures/sample-2/unclosed-if.nut', 'utf-8');
    machine.sourceParser.sourceName = 'unclosed-if.nut';
    expect(() => machine.sourceParser.parse(content)).toThrowAnyError();
  });

});
