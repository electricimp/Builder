// Copyright (c) 2016-2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');

const init = require('./init')('main');
const Machine = require('../../src/Machine');
const fs = require('fs');

describe('FileCache', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
    machine.cacheDir = './test/cache';
  });

  afterEach(() => {
    if (fs.existsSync(machine.cacheDir)) {
      machine.clearCache();
    }
  });

  it('should clear cache', () => {
    const link = 'github:test/test1/test.txt';
    machine.fileCache.cacheFile(link, 'hello');
    expect(machine.fileCache.findFile(link) ? true : false).toEqual(true);
    machine.clearCache();
    expect(machine.fileCache.findFile(link) ? true : false).toEqual(false);
  });

  it('should cache files', () => {
    const link = 'github:test/test1/test.txt';
    const ghRes = machine.fileCache._getCachedPath(link);
    machine.fileCache.cacheFile(link, 'hello');
    expect(fs.existsSync(ghRes)).toEqual(true);
  });

  it('should cache files in machine', () => {
    let linkName = 'github:electricimp/Builder/spec/fixtures/sample-11/LineBrakeSample.nut';
    machine.useCache = true;
    machine.execute(`@include '${linkName}'`);
    expect(machine.fileCache.findFile(linkName) ? true : false).toEqual(true);
    linkName = 'https://raw.githubusercontent.com/nobitlost/Builder/develop/spec/Builder.spec.js';
    machine.execute(`@include '${linkName}'`);
    expect(machine.fileCache.findFile(linkName) ? true : false).toEqual(true);
  });

  it('should exclude files from cache', () => {
    machine.useCache = true;
    let linkName = 'github:electricimp/Builder/spec/fixtures/sample-11/LineBrakeSample.nut';
    expect(machine.fileCache.findFile(linkName)).toEqual(false);
    machine.excludeList = __dirname + '/../fixtures/config/exclude-all.exclude';
    machine.execute(`@include '${linkName}'`);
    expect(machine.fileCache.findFile(linkName)).toEqual(false);
    linkName = 'https://raw.githubusercontent.com/nobitlost/Builder/develop/spec/Builder.spec.js';
    machine.execute(`@include '${linkName}'`);
    expect(machine.fileCache.findFile(linkName)).toEqual(false);
  });

});
