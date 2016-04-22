#! /usr/bin/env node

/**
 * Basic CLI for testing
 *
 * Usage:
 *  <this> input_file [-l]
 *
 *  input_file  - File to process
 *  -l          - Generate line control statements
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
\u001b[36m${packageJson.name}\u001b[39m v${packageJson.version} CLI
usage: ${Object.getOwnPropertyNames((packageJson.bin))[0]} <input_file> [-l (generate line control statements)] [-Dvarname value ...]
    `.trim());
}

/**
 * Read args
 * @return {{defines: {}, lineControl: boolean, input: string}}
 */
function readArgs() {
  let m;
  const res = {defines: {}, lineControl: false, input: null};
  const args = process.argv.splice(2);

  while (args.length > 0) {
    const arg = args.shift();

    if ('-l' === arg) {
      res.lineControl = true;
    } else if (m = arg.match(/^-D(.+)$/)) {
      const val = args.length ? args.shift() : null;
      res.defines[m[1]] = val;
    } else {
      res.input = arg;
    }
  }

  return res;
}

const args = readArgs();

if (!args.input) {
  usageInfo();
  process.exit(1);
}

// ctreate builder
const builder = new Builder();
builder.machine.generateLineControlStatements = args.lineControl;
builder.logger = new NullLogger();

// read args

// set the directory of the input file as first search dir
builder.machine.readers.file.searchDirs.unshift(path.dirname(path.resolve(args.input)));

try {
  // go
  const res = builder.machine.execute(`@include "${args.input.replace(/\"/g, `'`)}"`, args.defines);
  process.stdout.write(res);
} catch (e) {
  console.error('\u001b[31m' + ( e.message || e) + '\u001b[39m');
  process.exit(1);
}
