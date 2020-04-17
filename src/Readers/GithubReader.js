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

const HttpsProxyAgent = require('https-proxy-agent');
const path = require('path');
const Octokit = require('@octokit/rest');
const childProcess = require('child_process');
const packageJson = require('../../package.json');
const AbstractReader = require('./AbstractReader');

// child process timeout
const TIMEOUT = 30000;

// return codes
const STATUS_FETCH_FAILED = 2;
const STATUS_API_RATE_LIMIT = 3;

// marker presense on the command line
// tells that we're in the woker thread
const WORKER_MARKER = '__github_reader_worker___';

class GithubReader extends AbstractReader {

  constructor() {
    super();
    this.timeout = TIMEOUT;
  }

  supports(source) {
    return false !== GithubReader.parseUrl(source);
  }

  /**
   * Read file over HTTP/HTTPs
   * @param {string} source
   * @param {number=TIMEOUT} timeout - timeout (ms)
   * @return {string}
   */
  read(source, options) {

    // [debug]
    this.logger.debug(`Reading GitHub source "${source}"...`);

    // process dependencies
    if (options && options.dependencies && options.dependencies.has(source)) {
      this.gitBlobID = options.dependencies.get(source);
    }

    // spawn child process
    const child = childProcess.spawnSync(
      /* node */ process.argv[0],
      [/* self */ __filename,
        WORKER_MARKER,
        source,
        this.username,
        this.token,
        this.gitBlobID,
      ],
      { timeout: this.timeout }
    );

    if (STATUS_FETCH_FAILED === child.status || STATUS_API_RATE_LIMIT === child.status) {

      // predefined exit code errors
      throw new AbstractReader.Errors.SourceReadingError(
        child.stderr.toString()
      );

    } else if (0 !== child.status) {

      // misc exit code errors
      throw new AbstractReader.Errors.SourceReadingError(
        `Unknown error: ${child.stderr.toString()} (exit code ${child.status})`
      );

    } else {

      // errors that do not set erroneous exit code
      if (child.error) {

        if (child.error.errno === 'ETIMEDOUT') {

          // timeout
          throw new AbstractReader.Errors.SourceReadingError(
            `Failed to fetch url "${source}": timed out after ${this.timeout / 1000}s`
          );

        } else {

          // others
          throw new AbstractReader.Errors.SourceReadingError(
            `Failed to fetch url "${source}": ${child.error.errno}`
          );

        }

      } else {
        // s'all good
        const ret = JSON.parse(child.output[1].toString());

        // update dependencies map
        if (options && options.dependencies) {
          options.dependencies.set(source, ret.gitBlobID);
        }

        return ret.data;
      }

    }
  }

  /**
   * Parse path
   * @param {string} source
   * @return {{__FILE__, __PATH__}}
   */
  parsePath(source) {
    const parsed = GithubReader.parseUrl(source);
    return {
      __FILE__: path.basename(parsed.path),
      __PATH__: `github:${parsed.owner}/${parsed.repo}/${path.dirname(parsed.path)}`,
      __REPO_REF__: parsed.ref,
      __REPO_PREFIX__: `github:${parsed.owner}/${parsed.repo}`
    };
  }

  static processError(err, source) {
    try {
      err = JSON.parse(err.message);

      // detect rate limit hit
      if (err.message.indexOf('API rate limit exceeded') !== -1) {
        process.stderr.write('GitHub API rate limit exceeded');
        process.exit(STATUS_API_RATE_LIMIT);
      }

      process.stderr.write(`Failed to get source "${source}" from GitHub: ${err.message}`);
    } catch (e) {
      process.stderr.write(`Failed to get source "${source}" from GitHub: ${err.message}`);
    }

    // misc feth error
    process.exit(STATUS_FETCH_FAILED);
  }

  /**
   * Fethces the source ref and outputs it to STDOUT
   * @param {string} source
   */
  static fetch(source, username, password, gitBlobID) {
    var agent = null;
    if (process.env.HTTPS_PROXY) {
      agent = HttpsProxyAgent(process.env.HTTPS_PROXY);
    } else if (process.env.https_proxy) {
      agent = HttpsProxyAgent(process.env.https_proxy);
    }

    const octokitConfig = {
      userAgent: packageJson.name + '/' + packageJson.version,
      baseUrl: 'https://api.github.com',
      request: {
        agent: agent,
        timeout: 5000
      }
    };

    // authorization
    if (username != '' && password !== '') {
      octokitConfig.auth = {
        type: 'basic',
        username,
        password
      };
    }

    const octokit = new Octokit(octokitConfig);

    if (gitBlobID !== 'undefined') {
      const args = {
        owner: this.parseUrl(source).owner,
        repo: this.parseUrl(source).repo,
        file_sha: gitBlobID,
      };

      // @see https://octokit.github.io/rest.js/#api-Git-getBlob
      octokit.gitdata.getBlob(args)
        .then((res) => {
          const ret = {
            data: Buffer.from(res.data.content, 'base64').toString(),
            gitBlobID: res.data.sha,
          };
          process.stdout.write(JSON.stringify(ret));
        })
        .catch(err => GithubReader.processError(err, source));

      return;
    }

    // @see https://developer.github.com/v3/repos/contents/#get-contents
    octokit.repos.getContents(this.parseUrl(source))
      .then((res) => {
        const ret = {
          data: Buffer.from(res.data.content, 'base64').toString(),
          gitBlobID: res.data.sha,
        };
        process.stdout.write(JSON.stringify(ret));
      })
      .catch(err => GithubReader.processError(err, source));
  }

  /**
   * Parse Github reference into parts
   * @param source
   * @return {false|{user, repo, path, ref}}
   */
  static parseUrl(source) {
    // parse url
    const m = source.match(
      /^(github:|github\.com:|github\.com\/)([a-z0-9\-\._]+)\/([a-z0-9\-\._]+)\/(.*?)(?:@([^@]*))?$/i
    );

    if (m) {
      const res = {
        'owner': m[2],
        'repo': m[3],
        'path': m[4],
      };

      if (undefined !== m[5]) {
        res.ref = m[5];
      }

      return res;
    }

    return false;
  }

  get timeout() {
    return this._timeout;
  }

  set timeout(value) {
    this._timeout = value;
  }

  get username() {
    return this._username || '';
  }

  set username(value) {
    this._username = value;
  }

  get token() {
    return this._token || '';
  }

  set token(value) {
    this._token = value;
  }

  get password() {
    return this._token || '';
  }

  set password(value) {
    this._token = value;
  }
}

if (process.argv.indexOf(WORKER_MARKER) !== -1) {
  // launch worker
  GithubReader.fetch(process.argv[3], process.argv[4], process.argv[5], process.argv[6]);
} else {
  // acto as module
  module.exports = GithubReader;
}
