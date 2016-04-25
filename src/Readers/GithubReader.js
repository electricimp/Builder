/**
 * Github reader
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

const path = require('path');
const GitHubApi = require('github');
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
    return false !== GithubReader._parse(source);
  }

  /**
   * Read file over HTTP/HTTPs
   * @param {string} source
   * @param {number=TIMEOUT} timeout - timeout (ms)
   * @return {string}
   */
  read(source) {

    // [debug]
    this.logger.debug(`Reading GitHub source "${source}"...`);

    // spawn child process
    const child = childProcess.spawnSync(
      /* node */ process.argv[0],
      [/* self */ __filename, WORKER_MARKER, source, this.username, this.token],
      {timeout: this.timeout}
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
        return child.output[1].toString();
      }

    }
  }

  /**
   * Parse path
   * @param {string} source
   * @return {{__FILE__, __PATH__}}
   */
  parsePath(source) {
    const parsed = GithubReader._parse(source);
    return {
      __FILE__: path.basename(parsed.path),
      __PATH__: `github:${parsed.user}/${parsed.repo}/${path.dirname(parsed.path)}`
    };
  }

  /**
   * Fethces the source ref and outputs it to STDOUT
   * @param {string} source
   */
  static fetch(source, username, password) {

    const github = new GitHubApi({
      version: '3.0.0',
      debug: false,
      protocol: 'https',
      host: 'api.github.com',
      timeout: 5000,
      headers: {
        'user-agent': packageJson.name + '/' + packageJson.version,
        'accept': 'application/vnd.github.VERSION.raw'
      }
    });

    // authorization
    if (username != '' && password !== '') {
      github.authenticate({
        type: 'basic',
        username,
        password
      });
    }
    ;

    // @see http://mikedeboer.github.io/node-github/#repos.prototype.getContent
    github.repos.getContent(this._parse(source), (err, res) => {
      if (err) {

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

      } else {
        process.stdout.write(res);
      }
    });
  }

  /**
   * Parse Github reference into parts
   * @param source
   * @return {false|{user, repo, path, ref}}
   * @private
   */
  static _parse(source) {
    // parse url
    const m = source.match(
      /github(?:\.com)?(?:\/|\:)([a-z0-9\-]+)\/([a-z0-9\-]+)\/(.*?)(?:@([^@]*))?$/i
    );

    if (m) {
      const res = {
        'user': m[1],
        'repo': m[2],
        'path': m[3]
      };

      if (undefined !== m[4]) {
        res.ref = m[4];
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
  GithubReader.fetch(process.argv[3], process.argv[4], process.argv[5]);
} else {
  // acto as module
  module.exports = GithubReader;
}
