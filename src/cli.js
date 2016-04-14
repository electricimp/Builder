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

const packageJson = require('../package.json');

// usage info
if (process.argv.length === 2) {
  console.log(
    `
\u001b[36m${packageJson.name}\u001b[39m v${packageJson.version}
usage: ${Object.getOwnPropertyNames((packageJson.bin))[0]} <input_file> [options]
-l - generate line control statements
    `.trim());
  process.exit(1);
}
