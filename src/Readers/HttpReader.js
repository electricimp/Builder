/**
 * HTTP(S) file reader
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

const request = require('request');
const AbstractReader = require('./AbstractReader');

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

    request.get(url, (error, response, body) => {

      if (error) {
        throw new AbstractReader.Errors.SourceReadingError(
          `Failed to fetch url "${url}": ${error}`
        );
      } else if (response.statusCode >= 400) {
        throw new AbstractReader.Errors.SourceReadingError(
          `Failed to fetch url "${url}": ${response.statusCode}`
        );
      } else {



      }

    });
  }
}

module.exports = HttpReader;
