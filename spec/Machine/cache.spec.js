// Copyright (c) 2016-2020 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');

const init = require('./init')('main');
const path = require('path');
const Machine = require('../../src/Machine');
const fs = require('fs');

describe('FileCache', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
    machine.fileCache.cacheDir = './test-cache';
  });

  afterEach(() => {
    if (fs.existsSync(machine.fileCache.cacheDir)) {
      machine.clearCache();
    }
  });

  it('should clear cache', () => {
    const link = 'github:test/test1/test.txt';
    machine.fileCache._cacheFile(link, 'hello');
    expect(machine.fileCache._findFile(link) ? true : false).toEqual(true);
    machine.clearCache();
    expect(machine.fileCache._findFile(link) ? true : false).toEqual(false);
  });

  it('should cache files', () => {
    const link = 'github:test/test1/test.txt';
    const ghRes = machine.fileCache._getCachedPath(link);
    machine.fileCache._cacheFile(link, 'hello');
    expect(fs.existsSync(ghRes)).toEqual(true);
  });

  it('should not read cached files when cache option is off', () => {
    const link = 'github:electricimp/Builder/spec/fixtures/sample-11/LineBrakeSample.nut';
    machine.useCache = false;
    machine.fileCache._cacheFile(link, 'cached');
    expect(machine.execute(`@include '${link}'`)).not.toEqual('cached');
  });

  it('should cache files in machine', () => {
    let linkName = 'github:electricimp/Builder/spec/fixtures/sample-11/LineBrakeSample.nut';
    machine.useCache = true;
    machine.execute(`@include '${linkName}'`);
    expect(machine.fileCache._findFile(linkName) ? true : false).toEqual(true);
    linkName = 'https://raw.githubusercontent.com/nobitlost/Builder/develop/spec/Builder.spec.js';
    machine.execute(`@include '${linkName}'`);
    expect(machine.fileCache._findFile(linkName) ? true : false).toEqual(true);
  });

  it('should exclude remote files from cache', () => {
    machine.useCache = true;
    let linkName = 'github:electricimp/Builder/spec/fixtures/sample-11/LineBrakeSample.nut';
    expect(machine.fileCache._findFile(linkName)).toEqual(false);
    machine.excludeList = __dirname + '/../fixtures/config/exclude-all.exclude';
    machine.execute(`@include '${linkName}'`);
    expect(machine.fileCache._findFile(linkName)).toEqual(false);
    linkName = 'https://raw.githubusercontent.com/nobitlost/Builder/develop/spec/Builder.spec.js';
    machine.execute(`@include '${linkName}'`);
    expect(machine.fileCache._findFile(linkName)).toEqual(false);
  });

  it('should exclude files from cache by name', () => {
    machine.useCache = true;
    const path = __dirname + '/../fixtures/config/';
    machine.excludeList = __dirname + '/../fixtures/config/exclude-all.exclude';
    const linkList = [
      'github:electricimp/Builder/spec/fixtures/sample-11/LineBrakeSample.js',
      'github:electricimp/Builder/spec/fixtures/sample-11/OneLineSample.nut@v1.0.1',
      'github:electricimp/MessageManager/MessageManager.lib.nut',
      'github:electricimp/MessageManager/MessageManager.lib.js',
      'https://raw.githubusercontent.com/nobitlost/Builder/v2.0.0/src/AstParser.js',
      'https://raw.githubusercontent.com/nobitlost/Builder/v2.0.0/src/AstParser.js?nut=2',
      'http://raw.githubusercontent.com/nobitlost/Builder/src/AstParser.js',
      'http://raw.githubusercontent.com/nobitlost/Builder/src/AstParser.nut'
    ];
    const testFilesList = [
      'exclude-all.exclude',
      'exclude-nothing.exclude',
      'exclude-http.exclude',
      'exclude-js.exclude',
      'exclude-Builder.exclude',
      'exclude-tagged.exclude',
      'comment-exclude.exclude'
    ];
    const answerList = [
      /^(.*)$/,
      /^$/,
      /^http[^s](.*)$/,
      /^(.*)\.js(.*)$/,
      /^(.*)\/Builder\/(.*)$/,
      /^(.*)v\d\.\d\.\d(.*)$/,
      /^github(.*)v\d\.\d\.\d(.*)$/
    ];
    for (let i = 0; i < testFilesList.length; i++) {
      machine.excludeList = path + testFilesList[i];
      linkList.forEach((link) => {
        expect(machine.fileCache._isExcludedFromCache(link)).toEqual(answerList[i].test(link) || false);
      });
    }
  });

  it('should shorten filenames if they are longer then 256 symbols', () => {
    const longUrl = 'https://longlonglonglongurl.com/longlonglonglongurl/'
    + 'longlonglonglongurl/longlonglonglongurl/longlonglonglongurl/longlonglonglongurl/'
    + 'longlonglonglongurl/longlonglonglongurl/longlonglonglongurl/longlonglonglongurl/'
    + 'longlonglonglongurl/longlonglonglongurl/longlonglonglongurl/longlonglonglongurl/'
    + 'longlonglonglongurl/longlonglonglongurl/longesturl.js';
    expect(longUrl.length > 256).toEqual(true);
    expect(machine.fileCache._getCachedPath(longUrl).length < 256).toEqual(true);
  });

  it('should generate unique paths for different github links', () => {
    const linksSet = new Set();
    const links = ['github:a/b/c.js',
                   'github:b/a/c.js',
                   'github:a/b/c.js@a',
                   'github:a/b/c.j@s',
                   'github:a/b/a-b-c.js',
                   'github:a/b-c_js/c.js',
                   'github:a/b/c_js.js',
                   'github:a/b/c/js'
                  ];
    links.forEach(link => {
      const path = machine.fileCache._getCachedPath(link);
      expect(linksSet.has(path)).toEqual(false);
      linksSet.add(path);
    });
  });

  it('should generate unique paths for different url links', () => {
    const linksSet = new Set();
    const links = ['http://a/b/c.js',
                   'http://a/b/c.js?1',
                   'http://a/b/c.js?2',
                   'http://a/b/c.js?t=12',
                   'https://a/b/c.js',
                   'http://b/a/c.js',
                   'http://a.b/c.js',
                   'http://a.b/c.j?s=2',
                   'http://a/b/a-b-c.js',
                   'http://a/b-c_js/c.js',
                   'http://a/b/c_js.js',
                   'http://a/b/c/js',
                   'http://a.b.c/js'
                  ];
    links.forEach(link => {
      const path = machine.fileCache._getCachedPath(link);
      expect(linksSet.has(path)).toEqual(false);
      linksSet.add(path);
    });
  });

  it('should not change includePathParsed object', () => {
    let includePath = 'github:electricimp/Builder/spec/fixtures/sample-11/LineBrakeSample.nut';
    let context = {};
    machine.clearCache();
    machine.useCache = true;
    const reader = machine._getReader(includePath);
    const resFirst = machine.fileCache.read(reader, includePath, machine.dependencies, context);
    const resSecond = machine.fileCache.read(reader, includePath, machine.dependencies, context);
    expect(resSecond.includePathParsed.__PATH__).toBe('github:electricimp/Builder/spec/fixtures/sample-11');
  });

  it('should cache files or read from cache if use-dependencies options is on, save-dependencies if off, and dependencies do not include the file', () => {
    const dependenciesFile = path.join(process.cwd(), 'test-dependencies.json');
    const link1 = 'github:electricimp/Builder/spec/fixtures/sample-1/input.nut.out';
    const link2 = 'github:electricimp/Builder/spec/fixtures/sample-1/input.nut.json';
    machine.useCache = true;

    // --save-dependencies is on, --use-dependencies is off, reference to file
    // is not included
    machine.clearCache();
    machine.dependenciesSaveFile = dependenciesFile;
    machine.dependenciesUseFile = undefined;
    machine.execute(`@include "${link2}"`);
    let ghRes = machine.fileCache._getCachedPath(link2);
    expect(fs.existsSync(ghRes)).toEqual(false);

    // --save-dependencies is on, --use-dependencies is off, reference to file
    // is included
    machine.clearCache();
    machine.execute(`@include "${link2}"`);
    ghRes = machine.fileCache._getCachedPath(link2);
    expect(fs.existsSync(ghRes)).toEqual(false);

    // --save-dependencies is off, --use-dependencies is on, reference to file
    // is not included
    machine.clearCache();
    machine.dependenciesSaveFile = undefined;
    machine.dependenciesUseFile = dependenciesFile;
    machine.execute(`@include "${link1}"`);
    ghRes = machine.fileCache._getCachedPath(link1);
    expect(fs.existsSync(ghRes)).toEqual(true);

    // prepare to next check
    fs.unlinkSync(dependenciesFile);
    machine.clearCache();
    machine.dependenciesSaveFile = dependenciesFile;
    machine.dependenciesUseFile = undefined;
    machine.execute(`@include "${link1}"`);

    // --save-dependencies is off, --use-dependencies is on, reference to file
    // is included
    machine.clearCache();
    machine.dependenciesSaveFile = undefined;
    machine.dependenciesUseFile = dependenciesFile;
    machine.execute(`@include "${link1}"`);
    ghRes = machine.fileCache._getCachedPath(link1);
    expect(fs.existsSync(ghRes)).toEqual(false);

    // prepare to next check
    fs.unlinkSync(dependenciesFile);
    machine.clearCache();
    machine.dependenciesSaveFile = dependenciesFile;
    machine.dependenciesUseFile = undefined;
    machine.execute(`@include "${link1}"`);

    // --save-dependencies is on, --use-dependencies is on, reference to file
    // is not included
    machine.clearCache();
    machine.dependenciesSaveFile = dependenciesFile;
    machine.dependenciesUseFile = dependenciesFile;
    machine.execute(`@include "${link2}"`);
    ghRes = machine.fileCache._getCachedPath(link2);
    expect(fs.existsSync(ghRes)).toEqual(false);

    // --save-dependencies is on, --use-dependencies is on, reference to file
    // is included
    machine.clearCache();
    machine.execute(`@include "${link2}"`);
    ghRes = machine.fileCache._getCachedPath(link2);
    expect(fs.existsSync(ghRes)).toEqual(false);

    machine.clearCache();
    machine.dependenciesSaveFile = undefined;
    machine.dependenciesUseFile = undefined;
    fs.unlinkSync(dependenciesFile);
  });

});
