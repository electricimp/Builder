// Copyright (c) 2016-2019 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

const Builder = require('../src');
const Machine = require('../src/Machine');
const Log = require('log');
const fs = require('fs');

const backslashToSlash = require('./backslashToSlash')

describe('Builder', () => {

  let builder;

  beforeEach(() => {
    builder = new Builder();
    builder.machine.readers.github.username = process.env.SPEC_GITHUB_USERNAME;
    builder.machine.readers.github.password = process.env.SPEC_GITHUB_PASSWORD || process.env.SPEC_GITHUB_TOKEN;

    // @see https://www.npmjs.com/package/log#log-levels
    builder.logger = new Log(process.env.SPEC_LOGLEVEL || 'error');

  });

  it('should add end of file symbol at the end of local files', () => {

    let output = builder.machine.execute(`
      @include "${backslashToSlash(__dirname)}/fixtures/sample-11/OneLineSample.nut"
      @include "${backslashToSlash(__dirname)}/fixtures/sample-11/LineBrakeSample.nut"
      @include "${backslashToSlash(__dirname)}/fixtures/sample-11/OneLineSample.nut"
      @include "${backslashToSlash(__dirname)}/fixtures/sample-11/LineBrakeSample.nut"
    `);
    expect(output.split('\n').length).toBe(6);

    output = builder.machine.execute(`
      @include "${backslashToSlash(__dirname)}/fixtures/sample-11/OneLineSample.nut"
      @include "${backslashToSlash(__dirname)}/fixtures/sample-11/OneLineSample.nut"
      @include "${backslashToSlash(__dirname)}/fixtures/sample-11/OneLineSample.nut"
      @include "${backslashToSlash(__dirname)}/fixtures/sample-11/OneLineSample.nut"
    `);
    expect(output.split('\n').length).toBe(6);

    output = builder.machine.execute(`
      @include "${backslashToSlash(__dirname)}/fixtures/sample-11/LineBrakeSample.nut"
      @include "${backslashToSlash(__dirname)}/fixtures/sample-11/LineBrakeSample.nut"
      @include "${backslashToSlash(__dirname)}/fixtures/sample-11/LineBrakeSample.nut"
      @include "${backslashToSlash(__dirname)}/fixtures/sample-11/LineBrakeSample.nut"
    `);
    expect(output.split('\n').length).toBe(6);
  });


  it('should add end of line symbol at the end of files included from GitHub', () => {
    const githubPrefix = "github:electricimp/Builder/spec";

    let output = builder.machine.execute(`
      @include "${githubPrefix}/fixtures/sample-11/OneLineSample.nut"
      @include "${githubPrefix}/fixtures/sample-11/LineBrakeSample.nut"
      @include "${githubPrefix}/fixtures/sample-11/OneLineSample.nut"
      @include "${githubPrefix}/fixtures/sample-11/LineBrakeSample.nut"
    `);
    expect(output.split('\n').length).toBe(6);

    output = builder.machine.execute(`
      @include "${githubPrefix}/fixtures/sample-11/OneLineSample.nut"
      @include "${githubPrefix}/fixtures/sample-11/OneLineSample.nut"
      @include "${githubPrefix}/fixtures/sample-11/OneLineSample.nut"
      @include "${githubPrefix}/fixtures/sample-11/OneLineSample.nut"
    `);
    expect(output.split('\n').length).toBe(6);

    output = builder.machine.execute(`
      @include "${githubPrefix}/fixtures/sample-11/LineBrakeSample.nut"
      @include "${githubPrefix}/fixtures/sample-11/LineBrakeSample.nut"
      @include "${githubPrefix}/fixtures/sample-11/LineBrakeSample.nut"
      @include "${githubPrefix}/fixtures/sample-11/LineBrakeSample.nut"
    `);
    expect(output.split('\n').length).toBe(6);
  });

   it('should have empty lines at the end of the files included from http', () => {
    const websitePrefix = "https://raw.githubusercontent.com/electricimp/Builder/develop/spec";

    let output = builder.machine.execute(`
      @include "${websitePrefix}/fixtures/sample-11/OneLineSample.nut"
      @include "${websitePrefix}/fixtures/sample-11/LineBrakeSample.nut"
      @include "${websitePrefix}/fixtures/sample-11/OneLineSample.nut"
      @include "${websitePrefix}/fixtures/sample-11/LineBrakeSample.nut"
    `);
    expect(output.split('\n').length).toBe(6);

    output = builder.machine.execute(`
      @include "${websitePrefix}/fixtures/sample-11/OneLineSample.nut"
      @include "${websitePrefix}/fixtures/sample-11/OneLineSample.nut"
      @include "${websitePrefix}/fixtures/sample-11/OneLineSample.nut"
      @include "${websitePrefix}/fixtures/sample-11/OneLineSample.nut"
    `);
    expect(output.split('\n').length).toBe(6);

    output = builder.machine.execute(`
      @include "${websitePrefix}/fixtures/sample-11/LineBrakeSample.nut"
      @include "${websitePrefix}/fixtures/sample-11/LineBrakeSample.nut"
      @include "${websitePrefix}/fixtures/sample-11/LineBrakeSample.nut"
      @include "${websitePrefix}/fixtures/sample-11/LineBrakeSample.nut"
    `);
    expect(output.split('\n').length).toBe(6);
  });


});
