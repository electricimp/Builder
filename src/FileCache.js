// Copyright (c) 2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

const fs = require('fs-extra');
const url = require('url');
const path = require('path');
const minimatch = require('minimatch');
const HttpReader = require('./Readers/HttpReader');
const GithubReader = require('./Readers/GithubReader');
const GITHUB_DIR = path.sep + 'github';
const HTTP_DIR = path.sep + 'http';
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
    const ghRes = GithubReader.parseUrl(link);
    if (ghRes !== false) {
      return this._getCachedGithubPath(ghRes);
    }
    if (new HttpReader().supports(link)) {
      return this._getCachedHttpPath(link);
    }
  }

  /**
   * Transform github link to path and filename
   * @param {string} link link to the file
   * @return {string} folder and name, where cache file can be found
   * @private
   */
  _getCachedHttpPath(httpLink) {
    // parse url parts
    const parsedUrl = url.parse(httpLink);
    const domain = parsedUrl.hostname.split('.'); // it is web-site name
    // create new path from url
    const newPath = this.cacheDir + HTTP_DIR + path.join.apply(domain.filter((elem) => elem != 'www').reverse())
      + (parsedUrl.pathname ? parsedUrl.pathname.replace(/\//g, path.sep) : '');
    return newPath;
  }

  /**
   * Transform url link to path and filename
   * @param {{user, repo, path, ref}} ghRes github parsed link to the file
   * @return {string} folder and name, where cache file can be found
   * @private
   */
  _getCachedGithubPath(ghRes) {
    // find, where fileName starts
    const i = ghRes.path.lastIndexOf('/');
    let newPath;
    let fileName;
    // check case, when filename goes after user and repo
    if (i != -1) {
      newPath = ghRes.path.substr(0, i).replace(/\//g, path.sep);
      fileName = ghRes.path.substr(i + 1);
    }
    const filePath = this.cacheDir + GITHUB_DIR + path.sep + ghRes.user + path.sep + ghRes.repo
      + (ghRes.ref ? path.sep + ghRes.ref : '') + path.sep + (i != -1 ? newPath + path.sep + fileName : ghRes.path.replace(/\//g, path.sep));
    return filePath;
  }

  /**
   * Create all subfolders and write file to them
   * @param {string} path path to the file
   * @param {string} content content of the file
   */
  cacheFile(filePath, content) {
    const finalPath = this._getCachedPath(filePath);
    try {
      if (!fs.existsSync(finalPath)) {
        fs.ensureDirSync(path.dirname(finalPath));
        fs.writeFileSync(finalPath, content);
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
  findFile(link) {
    const finalPath = this._getCachedPath(link);
    return fs.existsSync(finalPath) ? finalPath : false;
  }

  /**
   * Check, has reader to be cached
   * @param {AbstractReader} reader
   * @return {boolean} result
   * @private
   */
  isCachedReader(reader) {
    return CACHED_READERS.some((cachedReader) => (reader instanceof cachedReader));
  }

  /**
   * Check, has file to be excluded from cache
   * @param {string} path to the file
   * @return {boolean} result
   */
  isExcludedFromCache(includedPath) {
    return this._excludeList.some((regexp) => regexp.test(includedPath));
  }

  toBeCached(includePath) {
    return this.useCache && !this.isExcludedFromCache(includePath);
  }

  clearCache() {
    fs.removeSync(this.cacheDir);
  }

  isCacheFileOutdate(pathname) {
    const stat = fs.statSync(pathname);
    return Date.now() - stat.mtime > this._outdateTime;
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
