// MIT License
//
// Copyright 2016-2023 Electric Imp
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
const upath = require('upath');
const { Octokit } = require('@octokit/rest');
const nodeFetch = require('node-fetch');
const packageJson = require('../../package.json');
const AbstractReader = require('./AbstractReader');
const WorkerThreads = require('worker_threads');

// child process timeout
const TIMEOUT = 30000;

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
      var gitBlobID = options.dependencies.get(source);
    }

    let result;

    const worker = new WorkerThreads.Worker(__filename);
    worker.ref();

    try {
      // We need 4 bytes to store a 32-bit integer
      const shared = new SharedArrayBuffer(4);
      const int32 = new Int32Array(shared);
      const args = [source, this.token, gitBlobID];

      const { port1: localPort, port2: workerPort } = new WorkerThreads.MessageChannel();
      worker.postMessage({ port: workerPort, shared, args }, [workerPort]);

      Atomics.wait(int32, 0, 0, TIMEOUT);

      // Contains either 'result' or 'error'.
      // undefined in case of timeout
      const msg = WorkerThreads.receiveMessageOnPort(localPort);
      if (msg === undefined) {
        throw new AbstractReader.Errors.SourceReadingError(
          `Failed to fetch url "${source}": timed out after ${this.timeout / 1000}s`
        );
      }

      const msgPayload = msg.message;
      if ('error' in msgPayload) {
        throw new AbstractReader.Errors.SourceReadingError(
          `Failed to fetch url "${source}": ${msgPayload.error}`
        );
      }

      result = msgPayload.result;
    } finally {
      worker.unref();
    }

    // update dependencies map
    if (options && options.dependencies) {
      options.dependencies.set(source, result.gitBlobID);
    }

    return result.data;
  }

  /**
   * Parse path
   * @param {string} source
   * @return {{__FILE__, __PATH__}}
   */
  parsePath(source) {
    const parsed = GithubReader.parseUrl(source);
    return {
      __FILE__: upath.basename(parsed.path),
      __PATH__: `github:${parsed.owner}/${parsed.repo}/${upath.dirname(parsed.path)}`,
      __REPO_REF__: parsed.ref,
      __REPO_PREFIX__: `github:${parsed.owner}/${parsed.repo}`
    };
  }

  /**
   * Fethces the source ref
   * @param {string} source - Path/reference to the source to be fetched
   * @param {string} token - Token
   * @param {string} [gitBlobID] - Git blob ID
   * @return {Promise}
   */
  static async fetch(source, token, gitBlobID) {
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
        fetch: nodeFetch,
        timeout: 5000
      }
    };

    // authorization
    if (token !== '') {
      octokitConfig.auth = token;
    }

    const octokit = new Octokit(octokitConfig);

    const parsedUrl = GithubReader.parseUrl(source);
    parsedUrl.path = upath.normalize(parsedUrl.path);

    const extractData = res => ({
      data: Buffer.from(res.data.content, 'base64').toString(),
      gitBlobID: res.data.sha,
    });

    if (gitBlobID !== undefined) {
      const args = {
        owner: parsedUrl.owner,
        repo: parsedUrl.repo,
        file_sha: gitBlobID,
      };

      // @see https://octokit.github.io/rest.js/#api-Git-getBlob
      return octokit.rest.git.getBlob(args).then(extractData);
    }

    // @see https://developer.github.com/v3/repos/contents/#get-contents
    return octokit.rest.repos.getContent(parsedUrl).then(extractData);
  }

  /**
   * Parse Github reference into parts
   * @param source
   * @return {false|{user, repo, path, ref}}
   */
  static parseUrl(source) {
    // parse url
    // The @ character must not be present in the name of the file
    // which is being included from repository, in order to parse branch/tag/commit correctly
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

  get token() {
    return this._token || '';
  }

  set token(value) {
    this._token = value;
  }
}

if (WorkerThreads.isMainThread) {
  // acto as module
  module.exports = GithubReader;
} else {
  const onMsg = async function(message) {
      const { port, shared, args } = message;

      try {
        const result = await GithubReader.fetch(...args);
        port.postMessage({ result });
      } catch (error) {
        port.postMessage({ error });
      } finally {
        const int32 = new Int32Array(shared);
        Atomics.notify(int32, 0);
      }
  };

  WorkerThreads.parentPort.on('message', onMsg);
}
