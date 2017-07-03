// Copyright (c) 2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

const fs = require('fs-extra');
const path = require('path');
const minimatch = require('minimatch');
const md5 = require('md5');
const HttpReader = require('./Readers/HttpReader');
const GithubReader = require('./Readers/GithubReader');

const DEFAULT_EXCLUDE_FILE_NAME = 'builder-cache.exclude';
const CACHED_READERS = [GithubReader, HttpReader];
const CACHE_LIFETIME = 1; // in days

class FileCache {

  constructor(machine) {
    this._useCache = false;
    this._cacheDir = '.' + path.sep + '.builder-cache';
    this._excludeList = [];
    this._machine = machine;
    this._outdateTime = CACHE_LIFETIME * 86400000; // precalc milliseconds in one day
  }

  /**
   * Transform url or github link to path and filename
   * It is important, that path and filename are unique,
   * because collision can break the build
   * @param {string} link link to the file
   * @return {string} folder and name, where cache file can be found
   * @private
   */
  _getCachedPath(link) {
    link = link.replace(/^github\:/, 'github#'); // replace ':' for '#' in github protocol
    link = link.replace(/\:\/\//, '#'); // repalce '://' for '#' in url
    link = link.replace(/\./g, '_');
    link = link.replace(/\//g, '-'); // replace '/' for '-'
    link = link.replace(/\?(.*)/g, ''); // delete get parameters from url
    if (link.length > 250) {
      const startPart = link.substr(0, 100);
      const endPart = link.substr(link.length - 100);
      const middlePart = md5(link);
      link = startPart + endPart + middlePart;
    }
    return this._cacheDir + path.sep + link;
  }

  /**
   * Create all subfolders and write file to them
   * @param {string} path path to the file
   * @param {string} content content of the file
   */
  _cacheFile(filePath, content) {
    const finalPath = this._getCachedPath(filePath);
    try {
      if (!fs.existsSync(finalPath)) {
        fs.ensureDirSync(path.dirname(finalPath));
        fs.writeFileSync(finalPath, content);
      } else {
        this._machine.logger.error(`File "${filePath}" already exist and can't be cached`);
      }
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
  read(reader, includePath) {
    let needCache = false;
    if (this._toBeCached(includePath) && this._isCachedReader(reader)) {
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
    const includePathParsed = reader.parsePath(includePath);
    let content = reader.read(includePath);

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
