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

const Builder = require('./index');
const packageJson = require('../package.json');
const path = require('path');

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

function usageInfo() {
  // print usage info
  console.log(
    `
\u001b[36m${packageJson.name}\u001b[39m v${packageJson.version} CLI
usage: ${Object.getOwnPropertyNames((packageJson.bin))[0]} <input_file> [-l (generate line control statements)]
    `.trim());
}

if (/* check if we have enought args */ process.argv.length < 3 || process.argv.length > 4) {
  usageInfo();
  process.exit(1);
}

// ctreate builder
const builder = new Builder();
builder.machine.generateLineControlStatements = false;
builder.logger = new NullLogger();

// read args

let inputFile;

for (let i = 2; i < process.argv.length; i++) {
  if ('-l' === process.argv[i]) {
    builder.machine.generateLineControlStatements = true;
  } else {
    inputFile = process.argv[i];
  }
}

// if no input file supplied, bark
if (!inputFile) {
  usageInfo();
  process.exit(1);
}

// set the directory of the input file as first search dir
builder.machine.readers.file.searchDirs.unshift(path.dirname(path.resolve(inputFile)));

try {
  // execute
  const res = builder.machine.execute(`@include "${inputFile.replace(/\"/g, `'`)}"`);

  // here we go
  console.log(res);
} catch (e) {

  console.error('\u001b[31m' + ( e.message || e) + '\u001b[39m');
  process.exit(1);
}

