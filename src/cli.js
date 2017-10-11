#! /usr/bin/env node

// MIT License
//
// Copyright 2016-2017 Electric Imp
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

usage:\n\t\u001b[34m${Object.getOwnPropertyNames((packageJson.bin))[0]} [-l] [-D<varname> <value> ...] [--github-user <usename> --github-token <token>] <input_file>\u001b[39m
where:
\t\u001b[34m-l\u001b[39m - generate line control statements
\t\u001b[34m-D<varname> <value>\u001b[39m - define a variable that will be available from the source
\t\u001b[34m--github-user <username>\u001b[39m - username for GitHub
\t\u001b[34m--github-token <token>\u001b[39m - personal access token or password for GitHub
\t\u001b[34m--cache>\u001b[39m - enable cache for remote files
\t\u001b[34m--clear-cache\u001b[39m - delete cache folder before running
\t\u001b[34m--cache-exclude-list <path_to_file>\u001b[39m - path to exclude list file
    `.trim());
}

/**
 * Read args
 * @return {{defines: {}, lineControl: boolean, input: string, gh: {user, token}, cache: boolean, clean: boolean, excludeFile: string}
 */
function readArgs() {
  let m;
  const res = {defines: {}, cache: false, lineControl: false, input: null, gh: {user: null, token: null}, clean : false, excludeFile : '', cacheFolder: '', filters: []};
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
    } else if (argument === '--filters' || argument === '-f') {
      if (!args.length) {
        throw Error('Expected argument value after ' + argument);
      }
      res.filters.push(args.shift());
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
  const builder = new Builder({ filters: args.filters });
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
  //set cache settings
  builder.machine.excludeList = args.excludeFile;
  // go
  const res = builder.machine.execute(`@include "${args.input.replace(/\"/g, `'`)}"`, args.defines);
  process.stdout.write(res);

} catch (e) {
  console.error('\u001b[31m' + ( e.message || e) + '\u001b[39m');
  process.exit(1);
}

