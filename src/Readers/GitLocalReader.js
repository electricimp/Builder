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

const upath = require('upath');
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
    const m = source.match(
      /^(git-local:)([^@]+)(?:@([^@]*))?$/i
    );

    return m !== null;
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

    const ref = commitID ? commitID : sourceParsed.ref;
    const command = this.getContentCmd(sourceParsed.root, sourceParsed.relPath, ref);

    try {
      const content = childProcess.execSync(command).toString();

      if (needCommitID) {
        // Getting commit ID and writing it in dependencies
        commitID = this.getCommitID(sourceParsed.root, sourceParsed.ref);
        options.dependencies.set(source, commitID);
      }

      return content;
    } catch(err) {
      throw new AbstractReader.Errors.SourceReadingError(err);
    }

  }

  /**
   * Returns a git command for getting content of the specified file
   * @param {string} root - root of the local git repo
   * @param {string} path - relative path to the file
   * @param {string} ref - branch name, tag or commit id
   * @return {string} git command
   */
  getContentCmd(root, path, ref) {
    return 'git -C ' + root + ' show ' + (ref ? ref : 'HEAD') + ':' + path;
  }

  /**
   * Get commit ID
   * @param {string} root - root of the local git repo
   * @param {string} ref - branch name, tag or commit id
   * @return {string} sha1 hex string
   */
  getCommitID(root, ref) {
    const command = 'git -C ' + root + ' rev-parse ' + (ref ? ref : 'HEAD');
    return childProcess.execSync(command).toString().trim();
  }

  /**
   * Parses source URI into __FILE__/__PATH__/__REPO_REF__/__REPO_PREFIX__
   * @param {string} source
   * @return {{__FILE__, __PATH__, __REPO_REF__, __REPO_PREFIX__}}
   */
  parsePath(source) {
    const parsed = GitLocalReader.parseUrl(source);
    const dir = upath.parse(parsed.path).dir;
    return {
      __FILE__: upath.basename(parsed.path),
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
    // The @ character must not be present in the name of the file
    // which is being included from repository, in order to parse branch/tag/commit correctly

    const m = source.match(
      /^(git-local:)([^@]+)(?:@([^@]*))?$/i
    );

    if (m) {
      const res = {
        'path': m[2],
      };

      if (undefined !== m[3]) {
        res.ref = m[3];
      }

      const rootAndRelativePath = GitLocalReader.getRepoRootAndRelativePath(res.path);

      if (rootAndRelativePath) {
        res.root = upath.normalize(rootAndRelativePath.root);
        res.relPath = upath.normalize(rootAndRelativePath.relPath);
        return res;
      } else {
        return false;
      }
    }

    return false;
  }

  /**
   * Get Repo Root and relative path
   * @param source
   * @return {false|{root, relPath}}
   */
  static getRepoRootAndRelativePath(source) {
    var pathParsed = upath.parse(source);
    if (!pathParsed) {
      return false;
    }

    let existingDir = pathParsed.dir;

    // Searching the existing dir
    while (true) {
      if (fs.existsSync(existingDir)) {
        break;
      }
      else {
        existingDir = upath.resolve(existingDir, '..');
      }
    }

    // Searching the repo root and relative path
    const command = 'git -C ' + existingDir + ' rev-parse --show-toplevel';
    try {
      const repoRoot = childProcess.execSync(command).toString().trim().replace(/\\/g, '/');
      const relativePath = upath.relative(repoRoot, source);

      return {
        'root': repoRoot,
        'relPath': relativePath
      };
    } catch(err) {
      throw new AbstractReader.Errors.SourceReadingError("Couldn't find the repo root. Probably " + existingDir + " is not a git repository (or any of the parent directories)");
    }
  }
}

module.exports = GitLocalReader;
