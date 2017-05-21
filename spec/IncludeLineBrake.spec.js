// Copyright (c) 2016-2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

const Builder = require('../src');
const Machine = require('../src/Machine');
const fs = require('fs');

describe('Builder', () => {

  let builder;

  beforeEach(() => {
    builder = new Builder();
    builder.machine.readers.github.username = process.env.SPEC_GITHUB_USERNAME;
    builder.machine.readers.github.password = process.env.SPEC_GITHUB_PASSWORD || process.env.SPEC_GITHUB_TOKEN;
  });

  it('should add LineBrake at the end of the file ', () => {
    const output = builder.machine.execute(`
      @include "${__dirname}/fixtures/sample-11/OneLineSample.nut"
      @include "${__dirname}/fixtures/sample-11/LineBrakeSample.nut"
    `);
    expect(output.split('\n').length).toBe(4);
  });

});
