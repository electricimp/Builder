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

const request = require('request');
const upath = require('upath');
const childProcess = require('child_process');
const AbstractReader = require('./AbstractReader');

// Azure DevOps services API url
const AZURE_API_URL = "https://dev.azure.com/";
// Child process timeout
const TIMEOUT = 30000;
// Child process error return code
const STATUS_FETCH_FAILED = 2;
// Marker presence on the command line tells that we're in the worker thread
const WORKER_MARKER = '__azure_repos_reader_worker__';

class AzureReposReader extends AbstractReader {

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
    return AzureReposReader.parseUrl(source) !== false;
  }

  /**
   * Reads file from Azure Repos
   * @param {string} source - source URI
   * @param {object} options - options such as dependencies map
   * @return {string}
   */
  read(source, options) {
    this.logger.debug(`Reading Azure Repos source "${source}"...`);
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

    // spawn child process
    const child = childProcess.spawnSync(
      /* node */ process.argv[0],
      [/* self */ __filename,
        WORKER_MARKER,
        source,
        this.username,
        this.token,
        commitID
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
   * Parse path
   * @param {string} source - source URI
   * @return {{__FILE__, __PATH__, __REPO_REF__, __REPO_PREFIX__}}
   */
  parsePath(source) {
    const parsed = AzureReposReader.parseUrl(source);
    return {
      __FILE__: upath.basename(parsed.path),
      __PATH__: `git-azure-repos:${parsed.org}/${parsed.project}/${parsed.repo}/${upath.dirname(parsed.path)}`,
      __REPO_REF__: parsed.ref,
      __REPO_PREFIX__: `git-azure-repos:${parsed.org}/${parsed.project}/${parsed.repo}`
    };
  }

  /**
   * Fetches the source and outputs it to STDOUT
   * @param {string} source - source URI
   * @param {string} username - username (if required)
   * @param {string} token - personal access token (if required)
   * @param {string} commitID - commit ID (SHA) if any specific commit should be used
   * @return {{data, commitID}}
   */
  static fetch(source, username, token, commitID) {
    var auth = null;

    if (username !== '' && token !== '') {
      auth = {
        "type": "basic",
        "username": username,
        "password": token
      };
    }

    const sourceParsed = this.parseUrl(source);

    AzureReposReader.downloadFile(auth, sourceParsed, commitID)
    .then(function(result) {
      const ret = {
        data: result.content,
        commitID: result.commitId
      };
      process.stdout.write(JSON.stringify(ret));
    });
  }

  /**
   * Makes an HTTP request to download the source file
   * @param {object} auth - authentication info
   * @param {object} sourceParsed - parsed source URI
   * @param {string} commitID - commit ID (SHA) if any specific commit should be used
   * @return {Promise}
   */
  static downloadFile(auth, sourceParsed, commitID) {
    sourceParsed.path = upath.normalize(sourceParsed.path);

    var baseUrl = AZURE_API_URL + `${sourceParsed.org}/${sourceParsed.project}` +
                  `/_apis/git/repositories/${sourceParsed.repo}/items?path=${sourceParsed.path}` +
                  `&api-version=5.1&$format=json&includeContent=true`;

    var params = {
      url: baseUrl,
      auth: auth,
      json: true
    };

    // If we have a specific commit id from the dependencies file, use-dependencies option is on and there is an appropriate record in the dependencies
    if (commitID !== 'null') {
      params.url += `&versionDescriptor.version=${commitID}&versionDescriptor.versionType=commit`;
      return AzureReposReader.httpGet(params);
    }

    if (sourceParsed.ref) {
      baseUrl += `&versionDescriptor.version=${sourceParsed.ref}`;
      // Try the ref as a branch name
      params.url = baseUrl + "&versionDescriptor.versionType=branch";
      // Will be rejected if not found
      return AzureReposReader.httpGet(params, true)
        .catch(() => {
          // Try the ref as a tag
          params.url = baseUrl + "&versionDescriptor.versionType=tag";
          // Will also be rejected if not found
          return AzureReposReader.httpGet(params, true);
        })
        .catch(() => {
          // Try the ref as a commit id
          params.url = baseUrl + "&versionDescriptor.versionType=commit";
          // Will terminate the process if not found or any other error occurred
          return AzureReposReader.httpGet(params, false);
        });
    }

    return AzureReposReader.httpGet(params);
  }

  /**
   * Makes an HTTP GET request. In case of an error terminates the process
   * (except the 404 Not found error when allowNotFound option used - in this case the returned promise is rejected)
   * @param {object} params - request's parameters (url, auth, ...)
   * @param {boolean} [allowNotFound=false] - if true, just reject the returned promise in case of 404 Not found error
   * @return {Promise}
   */
  static httpGet(params, allowNotFound = false) {
    return new Promise(function(resolve, reject) {
      const getCb = (error, resp, body) => {
        // Handle the response. This will:
        // - Return the response's body in case of success
        // - Return null in case of 404 Not found error if the allowNotFound option used
        // - Terminate the process otherwise
        const result = AzureReposReader.handleResponse(params.url, error, resp, allowNotFound);

        if (result) {
          resolve(result);
        } else {
          reject();
        }
      };

      request.get(params, getCb);
    });
  }

  /**
   * Checks the response of an HTTP request and returns the response's body in case of success. Terminates the process
   * in case of an error (except the 404 Not found error when allowNotFound option used - in this case returns null)
   * @param {string} url - request URL
   * @param {string} error - error message
   * @param {string} resp - response of the request
   * @param {boolean} [allowNotFound=false] - if true, just return null in case of 404 Not found error
   * @return {object|null}
   */
  static handleResponse(url, error, resp, allowNotFound = false) {
    try {
      if (error) {
        process.stderr.write(`Failed to fetch url "${url}": ${error}\n`);
        process.exit(STATUS_FETCH_FAILED);
      } else if (resp.statusCode == 404 && allowNotFound) {
        return null;
      } else if (resp.statusCode < 200 || resp.statusCode >= 300) {
        process.stderr.write(`Failed to fetch url "${url}": HTTP/${resp.statusCode}\n`);

        // In many cases Azure Repos includes error message(s)
        process.stderr.write(`Response from the server: ${JSON.stringify(resp.body)}\n`);

        process.exit(STATUS_FETCH_FAILED);
      }
    } catch (err) {
      process.stderr.write(`Failed to fetch url "${url}": ${err}\n`);
      process.exit(STATUS_FETCH_FAILED);
    }

    return resp.body;
  }

  /**
   * Parse Azure Repos reference into parts
   * @param source
   * @return {false|{org, project, repo, path, ref}}
   */
  static parseUrl(source) {
    // The @ character must not be present in the name of the file
    // which is being included from repository, in order to parse branch/tag/commit correctly
    const m = source.match(
      /^(git-azure-repos:)(~?[a-z0-9\-\._]+)\/(~?[a-z0-9\-\._]+)\/([a-z0-9\-\._]+)\/(.*?)(?:@([^@]*))?$/i
    );

    if (m) {
      const res = {
        'org': m[2],
        'project': m[3],
        'repo': m[4],
        'path': m[5],
      };

      if (undefined !== m[6]) {
        res.ref = m[6];
      }

      return res;
    }

    return false;
  }

}

if (process.argv.indexOf(WORKER_MARKER) !== -1) {
  // Launch worker
  AzureReposReader.fetch(process.argv[3], process.argv[4], process.argv[5], process.argv[6]);
} else {
  module.exports = AzureReposReader;
}
