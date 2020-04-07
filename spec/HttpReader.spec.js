// Copyright (c) 2016-2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

const fs = require('fs');
const Log = require('log');
const HttpReader = require('../src/Readers/HttpReader');
const eol = require('eol');
const AbstractReader = require('../src/Readers/AbstractReader');

describe('HttpReader', () => {

  let reader;

  beforeEach(function () {
    reader = new HttpReader();
    reader.timeout = 30000; // 30s

    // @see https://www.npmjs.com/package/log#log-levels
    reader.logger = new Log(process.env.SPEC_LOGLEVEL || 'error');
  });

  it('should read sample#1 from githubusercontent.com (http)', () => {
    const remote = reader.read('http://raw.githubusercontent.com/electricimp/Builder/master/spec/fixtures/sample-1/input.nut');
    const local = fs.readFileSync(__dirname + '/fixtures/sample-1/input.nut', 'utf-8');
    expect(remote).toEqual(eol.lf(local));
  });

  it('should read sample#1 from githubusercontent.com (https)', () => {
    const remote = reader.read('https://raw.githubusercontent.com/electricimp/Builder/master/spec/fixtures/sample-1/input.nut');
    const local = fs.readFileSync(__dirname + '/fixtures/sample-1/input.nut', 'utf-8');
    expect(remote).toEqual(eol.lf(local));
  });

  it('should throw a timeout error', () => {
    reader.timeout = 1; // 1 ms
    try {
      reader.read('https://raw.githubusercontent.com/electricimp/Builder/master/spec/fixtures/sample-1/input.nut');
      fail();
    } catch (e) {
      expect(e instanceof AbstractReader.Errors.SourceReadingError).toBeTruthy();
      // TODO: on node 6 this error message is different (considering it to be a node issue)
      // expect(e.message).diffChars('Failed to fetch url "https://raw.githubusercontent.com/' +
      //                             'electricimp/Builder/master/spec/fixtures/sample-1/input.nut": timed out after 0.001s');
    }
  });

  it('should throw HTTP/404 error', () => {
    try {
      reader.read('https://raw.githubusercontent.com/electricimp/Builder/master/spec/fixtures/sample-1/input.nut___');
      fail();
    } catch (e) {
      expect(e instanceof AbstractReader.Errors.SourceReadingError).toBeTruthy();
      // TODO: on node 6 this error message is different (considering it to be a node issue)
      // expect(e.message).diffChars('Failed to fetch url "https://raw.githubusercontent.com/' +
      //                             'electricimp/Builder/master/spec/fixtures/sample-1/input.nut___": HTTP/404');
    }
  });

  it('should throw an error on url with unknown domain', () => {
    try {
      reader.read('http://__unknowndomain__/');
      fail();
    } catch (e) {
      expect(e instanceof AbstractReader.Errors.SourceReadingError).toBeTruthy();
      expect(e.message.indexOf('Failed to fetch url "http://__unknowndomain__/":')).toEqual(0);
    }
  });

});
