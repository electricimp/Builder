#! /usr/bin/env node

// MIT License
//
// Copyright 2016-2019 Electric Imp
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

/**
 * Basic CLI for testing
 */

'use strict';

const path = require('path');
const Builder = require('./index');
const packageJson = require('../package.json');

/**
 * Blackhole logger
 */
class NullLogger {
  debug() {
  }

  info() {
  }

  warning() {
  }

  error() {
  }
}

/**
 * Print usage info
 */
function usageInfo() {
  // print usage info
  console.log(
    `
\u001b[36m${packageJson.name} v${packageJson.version} CLI\u001b[39m

usage:\n\t\u001b[34m${Object.getOwnPropertyNames((packageJson.bin))[0]} [-l] [-D<variable> <value>]
\t\t[--github-user <username> --github-token <token>]
\t\t[--bitbucket-server-addr <address>] [--bitbucket-server-user <username> --bitbucket-server-token <token>]
\t\t[--lib <path_to_file>] [--use-remote-relative-includes] [--suppress-duplicate-includes-warning]
\t\t[--cache] [--clear-cache] [--cache-exclude-list <path_to_file>]
\t\t[--save-dependencies [<path_to_file>]] [--use-dependencies [<path_to_file>]]
\t\t[--save-directives [<path_to_file>]] [--use-directives [<path_to_file>]] <input_file>\u001b[39m

where:
\t\u001b[34m-l\u001b[39m - generates line control statements
\t\u001b[34m-D<varname> <value>\u001b[39m - defines a variable
\t\u001b[34m--github-user <username>\u001b[39m - a GitHub username
\t\u001b[34m--github-token <token>\u001b[39m - a GitHub personal access token or password
\t\u001b[34m--bitbucket-server-addr <address>\u001b[39m - a Bitbucket Server address
\t\u001b[34m--bitbucket-server-user <username>\u001b[39m - a Bitbucket Server username
\t\u001b[34m--bitbucket-server-token <token>\u001b[39m - a Bitbucket Server personal access token or password
\t\u001b[34m--lib <path_to_file>\u001b[39m - include the specified JavaScript file(s) as a library
\t\u001b[34m--use-remote-relative-includes\u001b[39m - interpret every local include as relative to the location of the source file where it is mentioned
\t\u001b[34m--suppress-duplicate-includes-warning\u001b[39m - do not show a warning if a source file with the same content was included multiple times
\t\u001b[34m--cache>\u001b[39m - turn on caching for all files included from remote resources
\t\u001b[34m--clear-cache\u001b[39m - clear the cache before Builder starts running
\t\u001b[34m--cache-exclude-list <path_to_file>\u001b[39m - set the path to the file that lists resources which should not be cached
\t\u001b[34m--save-dependencies [path_to_file]\u001b[39m - save references to the required GitHub files in the specified file
\t\u001b[34m--use-dependencies [path_to_file]\u001b[39m - use the specified file to set which GitHub files are required
\t\u001b[34m--save-directives [path_to_file]\u001b[39m - save Builder variable definitions in the specified file
\t\u001b[34m--use-directives [path_to_file]\u001b[39m - use Builder variable definitions from the specified file
\t\u001b[34m<input_file>\u001b[39m — is the path to source file which should be preprocessed
    `.trim());
}

const dependenciesDefaultFileName = 'dependencies.json';
const directivesDefaultFileName = 'directives.json';

/**
 * Get CLI option value
 * @param {String} value CLI value
 * @param {String} defaultValue, will be uses if CLI the option value was not provided
 * @return {String}
 */
function getOption(args, defaultValue) {
  if (args.length == 1 || args[0][0] === '-') {
    return defaultValue;
  }

  return args.shift();
}

/**
 * Read args
 * @return {{defines: {}, lineControl: boolean, input: string, gh: {user, token}, cache: boolean, clean: boolean, excludeFile: string}
 */
function readArgs() {
  let m;
  const res = {
    defines: {},
    cache: false,
    lineControl: false,
    input: null,
    gh: {user: null, token: null},
    bbSrv: {addr: null, user: null, token: null},
    clean : false,
    excludeFile : '',
    cacheFolder: '',
    libs: [],
    suppressDupWarning: false,
  };
  const args = process.argv.splice(2);

  while (args.length > 0) {
    const argument = args.shift();

    if ('-l' === argument) {
      res.lineControl = true;
    } else if ('--cache' === argument || '-c' === argument) {
      res.cache = true;
    } else if ('--clear-cache' === argument) {
      res.clean = true;
    } else if (m = argument.match(/^-D(.+)$/)) {
      res.defines[m[1]] = args.length ? args.shift() : null;
    } else if (argument === '--github-user') {
      if (!args.length) {
        throw Error('Expected argument value after ' + argument);
      }
      res.gh.user = args.shift();
    } else if (argument === '--cache-exclude-list') {
      if (!args.length) {
        throw Error('Expected filename after ' + argument);
      }
      res.excludeFile = args.shift();
    } else if (argument === '--github-token') {
      if (!args.length) {
        throw Error('Expected argument value after ' + argument);
      }
      res.gh.token = args.shift();
    } else if (argument === '--bitbucket-server-addr') {
      if (!args.length) {
        throw Error('Expected argument value after ' + argument);
      }
      res.bbSrv.addr = args.shift();
    } else if (argument === '--bitbucket-server-user') {
      if (!args.length) {
        throw Error('Expected argument value after ' + argument);
      }
      res.bbSrv.user = args.shift();
    } else if (argument === '--bitbucket-server-token') {
      if (!args.length) {
        throw Error('Expected argument value after ' + argument);
      }
      res.bbSrv.token = args.shift();
    } else if (argument === '--lib' || argument === '--libs') {
      if (!args.length) {
        throw Error('Expected argument value after ' + argument);
      }
      res.libs.push(args.shift());
    } else if ('--save-dependencies' === argument) {
      if (!args.length) {
        throw Error('Expected argument value after ' + argument);
      }
      res.dependenciesSaveFile = getOption(args, dependenciesDefaultFileName);
    } else if ('--save-directives' === argument) {
      if (!args.length) {
        throw Error('Expected argument value after ' + argument);
      }
      res.directivesSaveFile = getOption(args, directivesDefaultFileName);
    } else if ('--use-remote-relative-includes' === argument) {
      res.remoteRelativeIncludes = true;
    } else if ('--suppress-duplicate-includes-warning' === argument || '--suppress-duplicate' === argument) {
      res.suppressDupWarning = true;
    } else if ('--use-dependencies' === argument) {
      if (!args.length) {
        throw Error('Expected argument value after ' + argument);
      }
      res.dependenciesUseFile = getOption(args, dependenciesDefaultFileName);
    } else if ('--use-directives' === argument) {
      if (!args.length) {
        throw Error('Expected argument value after ' + argument);
      }
      res.directivesUseFile = getOption(args, directivesDefaultFileName);
    } else {
      res.input = argument;
    }
  }

  return res;
}

try {
  // read args
  const args = readArgs();

  if (!args.input) {
    usageInfo();
    process.exit(1);
  }

  // create builder
  const builder = new Builder({ libs: args.libs });
  builder.machine.generateLineControlStatements = args.lineControl;
  builder.machine.useCache = args.cache;
  builder.logger = new NullLogger();
  if (args.clean) {
    builder.machine.clearCache();
  }

  // set the directory of the input file as first search dir
  builder.machine.readers.file.searchDirs.unshift(path.dirname(path.resolve(args.input)));

  // set GH credentials
  builder.machine.readers.github.username = args.gh.user;
  builder.machine.readers.github.token = args.gh.token;
  // set BB-Server addr and credentials
  builder.machine.readers.bitbucketSrv.serverAddr = args.bbSrv.addr;
  builder.machine.readers.bitbucketSrv.username = args.bbSrv.user;
  builder.machine.readers.bitbucketSrv.token = args.bbSrv.token;
  //set cache settings
  builder.machine.excludeList = args.excludeFile;
  // set remote relative includes
  builder.machine.remoteRelativeIncludes = args.remoteRelativeIncludes;
  // set supress dupicate includes warning
  builder.machine.suppressDupWarning = args.suppressDupWarning;
  // use dependencies
  builder.machine.dependenciesSaveFile = args.dependenciesSaveFile;
  builder.machine.dependenciesUseFile = args.dependenciesUseFile;
  // use directives
  builder.machine.directivesSaveFile = args.directivesSaveFile;
  builder.machine.directivesUseFile = args.directivesUseFile;

  // go
  const res = builder.machine.execute(`@include "${args.input.replace(/\"/g, `'`)}"`, args.defines);
  process.stdout.write(res);

} catch (e) {
  console.error('\u001b[31m' + (e.message || e) + '\u001b[39m');
  process.exit(1);
}
