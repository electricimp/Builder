#! /usr/bin/env node

/**
 * Basic CLI for testing
 *
 * @author Mikhail Yurasov <me@yurasov.me>
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
    `.trim());
}

/**
 * Read args
 * @return {{defines: {}, lineControl: boolean, input: string, gh: {user, token}}
 */
function readArgs() {
  let m;
  const res = {defines: {}, lineControl: false, input: null, gh: {user: null, token: null}};
  const args = process.argv.splice(2);

  while (args.length > 0) {
    const arg = args.shift();

    if ('-l' === arg) {
      res.lineControl = true;
    } else if (m = arg.match(/^-D(.+)$/)) {
      const val = args.length ? args.shift() : null;
      res.defines[m[1]] = val;
    } else if (arg === '--github-user') {
      if (!args.length) {
        throw Error('Expected argument value after ' + arg);
      }
      res.gh.user = args.shift();
    } else if (arg === '--github-token') {
      if (!args.length) {
        throw Error('Expected argument value after ' + arg);
      }
      res.gh.token = args.shift();
    } else {
      res.input = arg;
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

// ctreate builder
  const builder = new Builder();
  builder.machine.generateLineControlStatements = args.lineControl;
  builder.logger = new NullLogger();


  // set the directory of the input file as first search dir
  builder.machine.readers.file.searchDirs.unshift(path.dirname(path.resolve(args.input)));

  // set GH credentials
  builder.machine.readers.github.username = args.gh.user;
  builder.machine.readers.github.token = args.gh.token;

  // go
  const res = builder.machine.execute(`@include "${args.input.replace(/\"/g, `'`)}"`, args.defines);
  process.stdout.write(res);

} catch (e) {
  console.error('\u001b[31m' + ( e.message || e) + '\u001b[39m');
  process.exit(1);
}

