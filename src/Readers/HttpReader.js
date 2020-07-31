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

const request = require('request');
const childProcess = require('child_process');
const AbstractReader = require('./AbstractReader');

// child process timeout
const TIMEOUT = 30000;

// return codes
const STATUS_FETCH_FAILED = 2;
const STATUS_HTTP_ERROR = 3;

// marker presense on the command line
// tells that we're in the woker thread
const WORKER_MARKER = '__http_reader_worker___';

class HttpReader extends AbstractReader {

  constructor() {
    super();
    this.timeout = TIMEOUT;
  }

  supports(source) {
    // support http sources but not GIT repos
    return /^https?:/i.test(source) && !/\.git\b/i.test(source);
  }

  /**
   * Read file over HTTP/HTTPs
   * @param {string} url
   * @param {number=TIMEOUT} timeout - timeout (ms)
   * @return {string}
   */
  read(url) {

    // [debug]
    this.logger.debug(`Reading url "${url}"...`);

    // spawn child process
    const child = childProcess.spawnSync(
      /* node */ process.argv[0],
      [/* self */ __filename, WORKER_MARKER, url],
      {timeout: this.timeout}
    );

    if (STATUS_FETCH_FAILED === child.status || STATUS_HTTP_ERROR === child.status) {

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
            `Failed to fetch url "${url}": timed out after ${this.timeout / 1000}s`
          );

        } else {

          // others
          throw new AbstractReader.Errors.SourceReadingError(
            `Failed to fetch url "${url}": ${child.error.errno}`
          );

        }

      } else {
        // s'all good
        return child.output[1].toString();
      }

    }
  }

  /**
   * Parse path
   * @param {string} source
   * @return {{__FILE__, __PATH__, __URL_ROOT__, __URL_PATH__}}
   */
  parsePath(source) {
    const res = super.parsePath(source);
    const parsed = HttpReader.parseUrl(source);
    return {
      __FILE__: res.__FILE__,
      __PATH__: res.__PATH__.replace(':/', '://'),
      __URL_ROOT__: parsed.urlRoot.replace(/\\/g, '/'),
      __URL_PATH__: parsed.urlPath.replace(/\\/g, '/')
    };
  }

  /**
   * Fethces the url and outputs it to STDOUT
   * @param {string} url
   */
  static fetchUrl(url) {
    request.get(url, (error, response, body) => {
      if (error) {
        process.stderr.write(`Failed to fetch url "${url}": ${error}`);
        process.exit(STATUS_FETCH_FAILED);
      } else if (response.statusCode >= 400) {
        process.stderr.write(`Failed to fetch url "${url}": HTTP/${response.statusCode}`);
        process.exit(STATUS_HTTP_ERROR);
      } else {
        process.stdout.write(body);
      }
    });
  }

  /**
   * Parse url into parts
   * @param source
   * @return {false|{urlRoot, urlPath}}
   */
  static parseUrl(source) {
    // parse url
    const m = source.match(
      /^(http:\/\/[a-z0-9\-\._:]+|https:\/\/[a-z0-9\-\._:]+)\/(.+)?$/i
    );

    if (m) {
      const res = {
        'urlRoot': m[1],
        'urlPath': m[2]
      };

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
}

if (process.argv.indexOf(WORKER_MARKER) !== -1) {
  // launch worker
  HttpReader.fetchUrl(process.argv[3]);
} else {
  // acto as module
  module.exports = HttpReader;
}
