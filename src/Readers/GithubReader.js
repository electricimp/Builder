/**
 * Github reader
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

const HttpReader = require('./HttpReader');

class GithubReader extends HttpReader {

  supports(source) {
    return false !== this._parse(source);
  }

  read(url) {
    return super.read();
  }

  /**
   * Parse Github reference into parts
   * @param source
   * @return {false|{user, repository, path, tag}}
   * @private
   */
  _parse(source) {
    // parse url
    const m = source.match(
      /github(?:\.com)(?:\/|\:)([a-z0-9\-]+)\/([a-z0-9\-]+)\/(.*?)(?:@([^@]*))?$/i
    );

    if (m) {
      return {
        'user': m[1],
        'repository': m[2],
        'path': m[3],
        'tag': m[4] || 'master'
      };
    }

    return false;
  }
}

module.exports = GithubReader;
