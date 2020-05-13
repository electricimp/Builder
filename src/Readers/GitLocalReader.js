// MIT License
//
// Copyright 2020 Electric Imp
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

const path = require('path');
const childProcess = require('child_process');
const fs = require('fs');
const AbstractReader = require('./AbstractReader');
class GitLocalReader extends AbstractReader {

  constructor() {
    super();
  }

  /**
   * Checks if the requested source can be read by this reader
   * @param {string} source
   * @return {boolean}
   */
  supports(source) {
    return GitLocalReader.parseUrl(source) !== false;
  }

  /**
   * Reads file from local git repository
   * @param {string} source - source URI
   * @param {object} options - options such as dependencies map
   * @return {string}
   */
  read(source, options) {
    const sourceParsed = GitLocalReader.parseUrl(source);

    var commitID = null;
    var needCommitID = false;

    // Process dependencies
    if (options && options.dependencies) {
      if (options.dependencies.has(source)) {
        commitID = options.dependencies.get(source);
      } else {
        needCommitID = true;
      }
    }

    var command = null;

    if (commitID) {
      command = this.getCommand(sourceParsed.root, sourceParsed.relPath, commitID);
    }
    else {
      command = this.getCommand(sourceParsed.root, sourceParsed.relPath, sourceParsed.ref);
    }

    try {
      const result = childProcess.execSync(command).toString();
      if (needCommitID) {
        const commitIDCommand = this.getCommitIDCommand(sourceParsed.root, sourceParsed.ref);
        const commitIDResult = childProcess.execSync(commitIDCommand).toString().trim();
        options.dependencies.set(source, commitIDResult);
      }
      return result;
    }
    catch(err) {
      throw new AbstractReader.Errors.SourceReadingError(err);
    }


  }

  /**
   * Get git command
   * @param {string} root
   * @param {string} path
   * @param {string} ref
   * @return {string} git command
   */

  getCommand(root, path, ref) {
    if(ref) {
      return 'git -C ' + root + ' show ' + ref + ':' + path;
    }
    else {
      return 'git -C ' + root + ' show HEAD:' + path;
    }
  }

  /**
   * Get commit id command
   * @param {string} root
   * @return {string} commit id
   */

  getCommitIDCommand(root, ref) {
    if(ref) {
      return 'git -C ' + root + ' show -s --format=%H ' + ref;
    }
    else {
      return 'git -C ' + root + ' show -s --format=%H HEAD';
    }
  }

  /**
   * Parse path
   * @param {string} source
   * @return {{__FILE__, __PATH__, __REPO_REF__, __REPO_PREFIX__}}
   */
  parsePath(source) {
    const parsed = GitLocalReader.parseUrl(source);
    const dir = path.parse(parsed.path).dir;
    return {
      __FILE__: path.basename(parsed.path),
      __PATH__: `git-local:${dir}`,
      __REPO_REF__: parsed.ref,
      __REPO_PREFIX__: `git-local:${parsed.root}`
    };
  }

  /**
   * Parse Git Local reference into parts
   * @param source
   * @return {false|{root, relPath, path}}
   */
  static parseUrl(source) {
    const m = source.match(
      /^(git-local:)([^@:]+)(?:@([^@]*))?$/i
    );

    if (m) {
      const res = {
        'path': m[2],
      };

      if (undefined !== m[3]) {
        res.ref = m[3];
      }
      res.root = undefined;
      res.relPath = undefined;

      const result = GitLocalReader.getRepoRootAndRelativePath(res.path);

      if (result === false) {
        return false;
      }

      res.root = result.root;
      res.relPath = result.relPath;

      return res;
    }
    return false;
  }

  /**
   * Get Repo Root and relative path
   * @param source
   * @return {false|{root, relPath}}
   */
  static getRepoRootAndRelativePath(source) {
    var pathParsed = path.parse(source).dir;
    if(!pathParsed) {
      return false;
    }

    while (true) {
      if (fs.existsSync(pathParsed)) {
        break;
      }
      else {
        pathParsed = path.resolve(pathParsed, '..');
      }
    }

    const command = 'git -C ' + pathParsed + ' rev-parse --show-toplevel';
    try {
      const repoRoot = childProcess.execSync(command).toString().trim();
      const relativePath = path.relative(repoRoot, source);

      const res = {
        'root': repoRoot,
        'relPath': relativePath
      };

      return res;
    }
    catch(err) {
      throw new AbstractReader.Errors.SourceReadingError(pathParsed + " is not a git repository (or any of the parent directories)");
    }
  }
}

module.exports = GitLocalReader;
