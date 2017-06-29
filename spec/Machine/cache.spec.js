// Copyright (c) 2016-2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');

const init = require('./init')('main');
const Machine = require('../../src/Machine');
const fs = require('fs');

describe('Machine', () => {
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
    const ghRes = machine._normalizePath(link);
    const dirName = ghRes.dirPath;
    const fileName = ghRes.fileName;
    machine._mkdirpSync(dirName);
    machine._createFile(dirName + '/' + fileName, 'hello');
    expect(machine._isFileExist(link)).toEqual(true);
    machine.clearCache();
    expect(fs.existsSync(machine.cacheDir)).toEqual(false);
  });

  it('should correct delete and create folders', () => {
    const link = 'github:test/test1/test.txt';
    const ghRes = machine._normalizePath(link);
    const dirName = ghRes.dirPath;
    machine._mkdirpSync(dirName);
    expect(fs.existsSync(dirName)).toEqual(true);
    machine._deleteFolderRecursive(dirName);
    expect(fs.existsSync(dirName)).toEqual(false);
  });

  it('should correct delete and create files', () => {
    const link = 'github:test/test2/test.txt';
    const ghRes = machine._normalizePath(link);
    const dirName = ghRes.dirPath;
    const fileName = ghRes.fileName;
    machine._mkdirpSync(dirName);
    expect(fs.existsSync(dirName)).toEqual(true);
    machine._createFile(dirName + '/' + fileName, 'hello');
    expect(machine._isFileExist(link)).toEqual(true);
    machine._deleteFolderRecursive(dirName);
    expect(machine._isFileExist(link)).toEqual(false);
  });

  it('should cache files', () => {
    const linkName = 'github:electricimp/Builder/spec/fixtures/sample-11/LineBrakeSample.nut';
    machine.useCache = true;
    machine.execute(`@include '${linkName}'`);
    expect(machine._isFileExist(linkName)).toEqual(true);
    machine.useCache = true;
    machine.execute(`@include '${linkName}'`);
    expect(machine._isFileExist(linkName)).toEqual(true);
  });

  it('should exclude files from cache', () => {
    machine.useCache = true;
    const linkName = 'github:electricimp/Builder/spec/fixtures/sample-11/LineBrakeSample.nut';
    expect(machine._isFileExist(linkName)).toEqual(false);
    machine.useCache = true;
    machine.excludeList = __dirname + '/../fixtures/config/exclude-all.exclude';
    machine.execute(`@include '${linkName}'`);
    expect(machine._isFileExist(linkName)).toEqual(false);

    machine.execute(`@include '${linkName}'`);
    expect(machine._isFileExist(linkName)).toEqual(false);
  });


  // it('should correct delete and create files', () => {
  //   const link = 'github:test/test2/test.txt';
  //   const ghRes = machine._normalizePath(link);
  //   const dirName = ghRes.dirPath;
  //   const fileName = ghRes.fileName;
  //   machine._mkdirpSync(dirName);
  //   expect(fs.existsSync(dirName)).toEqual(true);
  //   machine._createFile(dirName + '/' + fileName, 'hello');
  //   expect(machine._isFileExist(link)).toEqual(true);
  //   machine._deleteFolderRecursive(dirName);
  //   expect(machine._isFileExist(link)).toEqual(false);
  // });
});
