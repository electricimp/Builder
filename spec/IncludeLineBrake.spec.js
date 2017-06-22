// Copyright (c) 2016-2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

const Builder = require('../src');
const Machine = require('../src/Machine');
const Log = require('log');
const fs = require('fs');

describe('Builder', () => {

  let builder;

  beforeEach(() => {
    builder = new Builder();
    builder.machine.readers.github.username = process.env.SPEC_GITHUB_USERNAME;
    builder.machine.readers.github.password = process.env.SPEC_GITHUB_PASSWORD || process.env.SPEC_GITHUB_TOKEN;

    // @see https://www.npmjs.com/package/log#log-levels
    builder.logger = new Log(process.env.SPEC_LOGLEVEL || 'error');

  });

  it('should add LineBrake at the end of the local file ', () => {

    let output = builder.machine.execute(`
      @include "${__dirname}/fixtures/sample-11/OneLineSample.nut"
      @include "${__dirname}/fixtures/sample-11/LineBrakeSample.nut"
      @include "${__dirname}/fixtures/sample-11/OneLineSample.nut"
      @include "${__dirname}/fixtures/sample-11/LineBrakeSample.nut"
    `);
    expect(output.split('\n').length).toBe(6);

    output = builder.machine.execute(`
      @include "${__dirname}/fixtures/sample-11/OneLineSample.nut"
      @include "${__dirname}/fixtures/sample-11/OneLineSample.nut"
      @include "${__dirname}/fixtures/sample-11/OneLineSample.nut"
      @include "${__dirname}/fixtures/sample-11/OneLineSample.nut"
    `);
    expect(output.split('\n').length).toBe(6);

    output = builder.machine.execute(`
      @include "${__dirname}/fixtures/sample-11/LineBrakeSample.nut"
      @include "${__dirname}/fixtures/sample-11/LineBrakeSample.nut"
      @include "${__dirname}/fixtures/sample-11/LineBrakeSample.nut"
      @include "${__dirname}/fixtures/sample-11/LineBrakeSample.nut"
    `);
    expect(output.split('\n').length).toBe(6);
  });


  it('should add LineBrake at the end of the github file ', () => {
    const githubPrefix = "github:nobitlost/Builder/spec";

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

   it('should add LineBrake at the end of the file from websites ', () => {
    const websitePrefix = "https://raw.githubusercontent.com/nobitlost/Builder/develop/spec";

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
