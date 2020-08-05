// MIT License
//
// Copyright 2016-2020 Electric Imp
//
// SPDX-License-Identifier: MIT
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
// EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
// OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

'use strict';

const fs = require('fs-extra');
const path = require('path');
const minimatch = require('minimatch');
const XXHash = require('xxhashjs');
const HttpReader = require('./Readers/HttpReader');
const GithubReader = require('./Readers/GithubReader');
const BitbucketServerReader = require('./Readers/BitbucketServerReader');
const AzureReposReader = require('./Readers/AzureReposReader');

const DEFAULT_EXCLUDE_FILE_NAME = 'builder-cache.exclude';
const CACHED_READERS = [GithubReader, BitbucketServerReader, AzureReposReader, HttpReader];
const CACHE_LIFETIME = 1; // in days
const HASH_SEED = 0xE1EC791C;
const MAX_FILENAME_LENGTH = 250;


class FileCache {

  constructor(machine) {
    this._cacheDir = '.' + path.sep + '.builder-cache';
    this._excludeList = [];
    this._machine = machine;
    this._outdateTime = CACHE_LIFETIME * 86400000; // precalc milliseconds in one day
    this._useCache = false;
  }

  /**
   * Transform url or github/bitbucket/azure link to path and filename
   * It is important, that path and filename are unique,
   * because collision can break the build
   * @param {string} link link to the file
   * @return {string} folder and name, where cache file can be found
   * @private
   */
  _getCachedPath(link) {
    link = link.replace(/^bitbucket-server\:/, 'bitbucket-server#'); // replace ':' for '#' in bitbucket-server protocol
    link = link.replace(/^github\:/, 'github#'); // replace ':' for '#' in github protocol
    link = link.replace(/^git-azure-repos\:/, 'git-azure-repos#'); // replace ':' for '#' in azure-repos protocol
    link = link.replace(/\:\/\//, '#'); // replace '://' for '#' in url
    link = link.replace(/\//g, '-'); // replace '/' for '-'
    const parts = link.match(/^([^\?]*)(\?(.*))?$/); // delete get parameters from url
    if (parts && parts[3]) {
      link = parts[1] + XXHash.h64(parts[3], HASH_SEED);
    }
    if (link.length > MAX_FILENAME_LENGTH) {
      const startPart = link.substr(0, 100);
      const endPart = link.substr(link.length - 100);
      const middlePart = XXHash.h64(link, HASH_SEED);
      link = startPart + endPart + middlePart;
    }
    return path.join(this._cacheDir, link);
  }

  /**
   * Create all subfolders and write file to them
   * @param {string} path path to the file
   * @param {string} content content of the file
   */
  _cacheFile(filePath, content) {
    const cachedPath = this._getCachedPath(filePath);
    try {
      fs.ensureDirSync(path.dirname(cachedPath));
      fs.writeFileSync(cachedPath, content);
    } catch (err) {
      this._machine.logger.error(err);
    }
  }

  /**
   * Check, is file exist by link and return path if exist
   * @param {{dirPath : string, fileName : string} | false} link link to the file
   * @return {string|false} result
   */
  _findFile(link) {
    const finalPath = this._getCachedPath(link);
    return fs.existsSync(finalPath) ? finalPath : false;
  }

  /**
   * Check, has reader to be cached
   * @param {AbstractReader} reader
   * @return {boolean} result
   * @private
   */
  _isCachedReader(reader) {
    return CACHED_READERS.some((cachedReader) => (reader instanceof cachedReader));
  }

  /**
   * Check, has file to be excluded from cache
   * @param {string} path to the file
   * @return {boolean} result
   */
  _isExcludedFromCache(includedPath) {
    return this._excludeList.some((regexp) => regexp.test(includedPath));
  }

  _toBeCached(includePath) {
    return this.useCache && !this._isExcludedFromCache(includePath);
  }

  /**
   * Check, is file outdated
   * @param {string} path to the file
   * @return {boolean} result
   */
  _isCacheFileOutdate(pathname) {
    const stat = fs.statSync(pathname);
    return Date.now() - stat.mtime > this._outdateTime;
  }

  /**
   * Read includePath and use cache if needed
   * @param {string} includePath link to the source
   * @param {AbstractReader} reader reader
   * @return {content: string, includePathParsed} content and parsed path
   * @private
   */
  read(reader, includePath, dependencies, context) {
    // Do this first as our includePath and reader may change on us if we have a cache hit
    const includePathParsed = reader.parsePath(includePath);
    const originalReader = reader;

    let needCache = false;
    // Cache file or read from cache only if --cache option is on and no
    // --save-dependencies option is used
    // If --use-dependencies option is used (together with --cache, of course),
    // then cache file or read from cache if no reference to it found in the specified file
    const depCondition = (!dependencies || dependencies.get(includePath) === undefined) && !this.machine.dependenciesSaveFile;
    if (depCondition && this._toBeCached(includePath) && this._isCachedReader(reader)) {
      let result;
      if ((result = this._findFile(includePath)) && !this._isCacheFileOutdate(result)) {
        // change reader to local reader
        includePath = result;
        this.machine.logger.info(`Read source from local path "${includePath}"`);
        reader = this.machine.readers.file;
      } else {
        needCache = true;
      }
    }

    const options = { dependencies: dependencies, context: context };

    if (originalReader === this.machine.readers.file) {
      // This allows the FileReader to return the actual path of the file (where it has been found)
      // But we don't need this behavior in case of reading from cache (so we saved the original reader at the top)
      options.resultPathParsed = includePathParsed;
    }

    let content = reader.read(includePath, options);

    // if content doesn't have line separator at the end, then add it
    if (content.length > 0 && content[content.length - 1] != '\n') {
      content += '\n';
    }

    if (needCache && this.useCache) {
      this.machine.logger.debug(`Caching file "${includePath}"`);
      this._cacheFile(includePath, content);
    }
    return {
      'content' : content,
      'includePathParsed' : includePathParsed
    };
  }

  clearCache() {
    fs.removeSync(this.cacheDir);
  }

  /**
   * Use cache?
   * @return {boolean}
   */
  get useCache() {
    return this._useCache || false;
  }

  /**
   * @param {boolean} value
   */
  set useCache(value) {
    this._useCache = value;
  }

  set cacheDir(value) {
    this._cacheDir = value.replace(/\//g, path.sep);
  }

  get cacheDir() {
    return this._cacheDir;
  }

  set machine(value) {
    this._machine = value;
  }

  get machine() {
    return this._machine;
  }

  get excludeList() {
    return this._excludeList;
  }

  /**
   * Construct exclude regexp list from filename
   * @param {string} name of exclude file. '' for default
   */
  set excludeList(fileName) {
    if (fileName == '') {
      fileName = DEFAULT_EXCLUDE_FILE_NAME;
    }

    const newPath = fileName;
    // check is fileName exist
    if (!fs.existsSync(newPath)) {
      if (fileName == DEFAULT_EXCLUDE_FILE_NAME) {
        // if it isn't exist and it is default, then put empty list
        this._excludeList = [];
        return;
      } else {
        throw new Error(`${newPath} file does not exist`);
      }
    }

    const content = fs.readFileSync(newPath, 'utf8');
    const filenames = content.split(/\n|\r\n/);
    // filters not empty strings, and makes regular expression from template
    const patterns = filenames.map((value) => value.trimLeft()) // trim for "is commented" check
      .filter((value) => (value != '' && value[0] != '#'))
      .map((value) => minimatch.makeRe(value));
    this._excludeList = patterns;
  }
}

module.exports = FileCache;
