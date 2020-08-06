// MIT License
//
// Copyright 2019-2020 Electric Imp
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

const request = require('request');
const upath = require('upath');
const childProcess = require('child_process');
const AbstractReader = require('./AbstractReader');

// Common API path
const API_PATH = "rest/api/1.0/";
// Child process timeout
const TIMEOUT = 30000;
// Child process error return code
const STATUS_FETCH_FAILED = 2;
// Marker presence on the command line tells that we're in the worker thread
const WORKER_MARKER = '__bitbucket_srv_reader_worker__';

class BitbucketServerReader extends AbstractReader {

  constructor() {
    super();
    this.timeout = TIMEOUT;
  }

  /**
   * Checks if the requested source can be read by this reader
   * @param {string} source
   * @return {boolean}
   */
  supports(source) {
    return BitbucketServerReader.parseUrl(source) !== false;
  }

  /**
   * Reads file from Bitbucket server
   * @param {string} source - source URI
   * @param {object} options - options such as dependencies map
   * @return {string}
   */
  read(source, options) {
    this.logger.debug(`Reading Bitbucket-server source "${source}"...`);

    if (!this.serverAddr) {
      throw new AbstractReader.Errors.SourceReadingError('Bitbucket Server address is not specified');
    }

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

    // Spawn child process
    const child = childProcess.spawnSync(
      /* node */ process.argv[0],
      [/* self */ __filename,
        WORKER_MARKER,
        this.serverAddr,
        source,
        this.username,
        this.token,
        commitID,
        needCommitID
      ],
      { timeout: this.timeout }
    );

    if (child.status === STATUS_FETCH_FAILED) {
      // Predefined exit code errors
      throw new AbstractReader.Errors.SourceReadingError(child.stderr.toString());
    } else if (child.status) {
      // Misc exit code errors
      throw new AbstractReader.Errors.SourceReadingError(
        `Unknown error: ${child.stderr.toString()} (exit code ${child.status})`
      );
    } else {
      // Errors that do not set erroneous exit code
      if (child.error) {
        if (child.error.errno === 'ETIMEDOUT') {
          // Timeout
          throw new AbstractReader.Errors.SourceReadingError(
            `Failed to fetch url "${source}": timed out after ${this.timeout / 1000}s`
          );
        } else {
          // Others
          throw new AbstractReader.Errors.SourceReadingError(
            `Failed to fetch url "${source}": ${child.error.errno}`
          );
        }
      } else if (child.status === null) {
        // No status code is set, no error is set
        throw new AbstractReader.Errors.SourceReadingError(
          `Unknown error: "${source}"`
        );
      } else {
        // Success
        const ret = JSON.parse(child.output[1].toString());

        // Update dependencies map if needed
        if (needCommitID) {
          options.dependencies.set(source, ret.commitID);
        }

        return ret.data;
      }
    }
  }

  /**
   * Parses source URI into __FILE__/__PATH__/__REPO_REF__/__REPO_PREFIX__
   * @param {string} source - source URI
   * @return {{__FILE__, __PATH__, __REPO_REF__, __REPO_PREFIX__}}
   */
  parsePath(source) {
    const parsed = BitbucketServerReader.parseUrl(source);
    return {
      __FILE__: upath.basename(parsed.path),
      __PATH__: `bitbucket-server:${parsed.project}/${parsed.repo}/${upath.dirname(parsed.path)}`,
      __REPO_REF__: parsed.ref,
      __REPO_PREFIX__: `bitbucket-server:${parsed.project}/${parsed.repo}`
    };
  }

  /**
   * Fetches the source and outputs it to STDOUT
   * @param {string} serverAddr - address of the Bitbucket server to fetch the file from
   * @param {string} source - source URI
   * @param {string} username - username (if required)
   * @param {string} password - password or token (if required)
   * @param {string} commitID - commit ID (SHA) if any specific commit (version of the file) should be used
   * @param {string} needCommitID - "true" if commit ID (SHA) is needed along with the file data
   * @return {{data, commitID}}
   */
  static fetch(serverAddr, source, username, password, commitID, needCommitID) {
    var auth = null;

    if (username !== '' && password !== '') {
      auth = {
        "type": "basic",
        "username": username,
        "password": password
      };
    }

    if (serverAddr.slice(-1) !== "/") {
      serverAddr += "/";
    }

    const sourceParsed = this.parseUrl(source);
    var ref = null;

    // commitID is always a string because it was passed as an arg of a process (childProcess.spawnSync)
    if (commitID !== "null") {
      ref = commitID;
    } else if (sourceParsed.ref !== undefined) {
      ref = sourceParsed.ref;
    }

    const promises = [BitbucketServerReader.downloadFile(serverAddr, auth, sourceParsed, ref)];

    // needCommitID is always a string because it was passed as an arg of a process (childProcess.spawnSync)
    if (needCommitID === "true") {
      promises.push(BitbucketServerReader.getCommitID(serverAddr, auth, sourceParsed, ref));
    }

    Promise.all(promises).then(function(results) {
      const ret = {
        data: results[0],
        commitID: results[1]
      };

      process.stdout.write(JSON.stringify(ret));
    });
  }

  /**
   * Makes an HTTP request to download the source file
   * @param {string} serverAddr - address of the Bitbucket server to fetch the file from
   * @param {object} auth - authentication info
   * @param {object} sourceParsed - parsed source URI
   * @param {string} ref - git branch name / tag / commit ID (SHA)
   * @return {Promise}
   */
  static downloadFile(serverAddr, auth, sourceParsed, ref) {
    sourceParsed.path = upath.normalize(sourceParsed.path);

    var url = serverAddr + API_PATH + `projects/${sourceParsed.project}/repos/${sourceParsed.repo}/raw/${sourceParsed.path}`;

    if (ref !== null) {
      url += "?at=" + ref;
    }

    const params = {
      uri: url,
      auth: auth,
      json: true,
      // NOTE: This parameter is not required in the general case and, moreover, it can affect security
      // But without it, Builder can't access Bitbucket servers with self-signed SSL certificates
      // This can be replaced with a more safe and right solution later
      rejectUnauthorized: false
    };

    return new Promise(function(resolve, reject) {
      request.get(params, (error, resp, body) => {
        BitbucketServerReader.checkResponse(url, error, resp);
        resolve(body);
      });
    });
  }

  /**
   * Makes an HTTP request to get the latest commit ID (SHA) correspondig to the optional ref specified in the source URI
   * @param {string} serverAddr - address of the Bitbucket server to fetch the file from
   * @param {object} auth - authentication info
   * @param {object} sourceParsed - parsed source URI
   * @param {string} ref - git branch name / tag / commit ID (SHA)
   * @return {Promise}
   */
  static getCommitID(serverAddr, auth, sourceParsed, ref) {
    var url = serverAddr + API_PATH + `projects/${sourceParsed.project}/repos/${sourceParsed.repo}/commits`;
    // We want to get only the latest commit, so we are setting limit=1
    url += "?limit=1";

    if (ref !== null) {
      // Set the ref to retrieve commits before (inclusively)
      url += "&until=" + ref;
    }

    const params = {
      uri: url,
      auth: auth,
      json: true,
      // NOTE: This parameter is not required in the general case and, moreover, it can affect security
      // But without it, Builder can't access Bitbucket servers with self-signed SSL certificates
      // This can be replaced with a more safe and right solution later
      rejectUnauthorized: false
    };

    return new Promise(function(resolve, reject) {
      request.get(params, (error, resp, body) => {
        BitbucketServerReader.checkResponse(url, error, resp);

        const commitID = body.values[0].id;
        resolve(commitID);
      });
    });
  }

  /**
   * Checks the response of an HTTP request. Terminates the process in case of an error
   * @param {string} url - request URL
   * @param {string} error - error message
   * @param {string} resp - response of the request
   */
  static checkResponse(url, error, resp) {
    try {
      if (error) {
        process.stderr.write(`Failed to fetch url "${url}": ${error}\n`);
        process.exit(STATUS_FETCH_FAILED);
      } else if (resp.statusCode < 200 || resp.statusCode >= 300) {
        process.stderr.write(`Failed to fetch url "${url}": HTTP/${resp.statusCode}\n`);

        // In many cases Bitbucket server includes error message(s)
        process.stderr.write(`Response from the server: ${JSON.stringify(resp.body)}\n`);

        process.exit(STATUS_FETCH_FAILED);
      }
    } catch (err) {
      process.stderr.write(`Failed to fetch url "${url}": ${err}\n`);
      process.exit(STATUS_FETCH_FAILED);
    }
  }

  /**
   * Parse Bitbucket server reference into parts
   * @param source
   * @return {false|{user, repo, path, ref}}
   */
  static parseUrl(source) {
    // The @ character must not be present in the name of the file
    // which is being included from repository, in order to parse branch/tag/commit correctly
    const m = source.match(
      /^(bitbucket-server:)(~?[a-z0-9\-\._]+)\/([a-z0-9\-\._]+)\/(.*?)(?:@([^@]*))?$/i
    );

    if (m) {
      const res = {
        'project': m[2],
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

  get serverAddr() {
    return this._serverAddr || '';
  }

  set serverAddr(value) {
    this._serverAddr = value;
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
  // Launch worker
  BitbucketServerReader.fetch(process.argv[3], process.argv[4], process.argv[5], process.argv[6], process.argv[7], process.argv[8]);
} else {
  module.exports = BitbucketServerReader;
}
