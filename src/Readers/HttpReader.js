/**
 * HTTP(S) file reader
 * @author Mikhail Yurasov <me@yurasov.me>
 */

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
  }

  /**
   * Read file over HTTP/HTTPs
   * @param {string} url
   * @return {string}
   */
  read(url) {

    // spawn child process
    const child = childProcess.spawnSync(
      /* node */ process.argv[0],
      /* self */ [__filename, WORKER_MARKER, url],
      {timeout: TIMEOUT}
    );

    if (STATUS_FETCH_FAILED === child.status || STATUS_HTTP_ERROR === child.status) {

      // predefined exit code errors
      throw new AbstractReader.Errors.SourceReadingError(child.stderr.toString());

    } else if (0 !== child.status) {

      // misc exit code errors
      throw new AbstractReader.Errors.SourceReadingError(`Unknown error: ${child.stderr.stoString()} (exit code ${child.status})`);

    } else {

      // errors that do not set erroneous exit code
      if (child.error) {

        if (child.error.errno === 'ETIMEDOUT') {

          // timeout
          throw new AbstractReader.Errors.SourceReadingError(`Failed to fetch url "${url}": timed out after ${TIMEOUT / 1000}s`);

        } else {

          // others
          throw new AbstractReader.Errors.SourceReadingError(`Failed to fetch url "${url}": ${child.error.errno}`);

        }

      } else {
        // s'all good
        return child.output[1].toString();
      }

    }
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
}

if (process.argv.indexOf(WORKER_MARKER) !== -1) {
  // launch worker
  HttpReader.fetchUrl(process.argv[3]);
} else {
  // acto as module
  module.exports = HttpReader;
}

