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

const Builder = require('../../src');
const backslashToSlash = require('../backslashToSlash');
const Log = require('log');
const path = require('path');
const fs = require('fs');

const LOCAL_REPO_NOT_DEFINED_MESSAGE = "SPEC_GIT_LOCAL_REPO_PATH is not defined. Test will be skipped";
const NO_ROOT_PERMISSION_MESSAGE = "No root permission. Test will be skipped";
const WINDOWS_SPECIFIED_TEST_MESSAGE = "Windows platform specified test will be skipped";

const TEST_DIR_NAME = "builder_test_g2e5r6uh";

describe('Remote relative option is enabled - ', () => {

  let builder;
  const contextPath = path.resolve(__dirname + "/../fixtures/include/sample-2/").replace(/\\/g, '/');

  beforeEach(() => {
    builder = new Builder();
    builder.machine.remoteRelativeIncludes = true;
    builder.machine.path = contextPath;
    builder.machine.readers.github.username = process.env.SPEC_GITHUB_USERNAME;
    builder.machine.readers.github.token = process.env.SPEC_GITHUB_PASSWORD || process.env.SPEC_GITHUB_TOKEN;
    builder.machine.clearCache = true;
    builder.logger = new Log(process.env.SPEC_LOGLEVEL || 'error');
  });

  describe('X path by https link - ', () => {

    const httpsPath = "https://raw.githubusercontent.com/EatonGMBD/Builder/feature/ADO-310-includes-enhancement/spec/fixtures/include/sample-2";

    it('should search Y file by web link', () => {
      let output = builder.machine.execute(`@include "` + httpsPath + `/LibA/dirX/x_case_y_https.nut"`);
      expect(output).toContain('// y.nut (case y remote)\n');
    });

    it('should search Y file in remote repository github', () => {
      let output = builder.machine.execute(`@include "` + httpsPath + `/LibA/dirX/x_case_y_github.nut"`);
      expect(output).toContain('// y.nut (case y remote)\n');
    });

    it('should search Y file in remote repository + Y path', () => {
      let output = builder.machine.execute(`@include "` + httpsPath + `/LibA/dirX/x_case_y_rel_local.nut"`);
      expect(output).toContain('// y.nut (case y rel)\n');
    });

    it('should search Y file by local abs path', () => {
      if (process.platform === "win32") {
        try {
          fs.accessSync("/", fs.constants.W_OK);
          fs.rmdirSync(`C:/${TEST_DIR_NAME}`, { recursive: true });
          fs.mkdirSync(`C:/${TEST_DIR_NAME}`);
          fs.writeFileSync(`C:/${TEST_DIR_NAME}/y.nut`, "// y.nut (case y abs)\n");
          let output = builder.machine.execute(`@include "` + httpsPath + `/LibA/dirX/x_case_y_abs_local.nut"`);
          fs.rmdirSync(`C:/${TEST_DIR_NAME}`, { recursive: true });
          expect(output).toContain('// y.nut (case y abs)\n');
        }
        catch (err) {
          console.log(NO_ROOT_PERMISSION_MESSAGE);
        }
      } else {
        console.log(WINDOWS_SPECIFIED_TEST_MESSAGE);
      }
    });
  });

  describe('X path by remote repo - ', () => {

    const githubPath = "github:EatonGMBD/Builder/spec/fixtures/include/sample-2";

    it('should search Y file by web link', () => {
      let output = builder.machine.execute(`@include "` + githubPath + `/LibA/dirX/x_case_y_https.nut@feature/ADO-310-includes-enhancement"`);
      expect(output).toContain('// y.nut (case y remote)\n');
    });

    it('should search Y file in remote repository root + Y path', () => {
      let output = builder.machine.execute(`@include "` + githubPath + `/LibA/dirX/x_case_y_abs_local_slash.nut@feature/ADO-310-includes-enhancement"`);
      expect(output).toContain('// y.nut (case y path from /)\n');
    });

    it('should search Y file in remote repository + Y path', () => {
      let output = builder.machine.execute(`@include "` + githubPath + `/LibA/dirX/x_case_y_rel_local.nut@feature/ADO-310-includes-enhancement"`);
      expect(output).toContain('// y.nut (case y rel)\n');
    });
  });

  describe('X path by local repo - ', () => {

    it('should search Y file in remote repository', () => {
      if (process.env.SPEC_GIT_LOCAL_REPO_PATH != undefined) {
        let output = builder.machine.execute(`@include "git-local:${process.env.SPEC_GIT_LOCAL_REPO_PATH}/spec/fixtures/include/sample-2/LibA/dirX/x_case_y_github.nut"`);
        expect(output).toContain('// y.nut (case y remote)\n');
      } else {
        console.log(LOCAL_REPO_NOT_DEFINED_MESSAGE);
      }
    });

    it('should search Y file in remote repository + Y path', () => {
      if (process.env.SPEC_GIT_LOCAL_REPO_PATH != undefined) {
        let output = builder.machine.execute(`@include "git-local:${process.env.SPEC_GIT_LOCAL_REPO_PATH}/spec/fixtures/include/sample-2/LibA/dirX/x_case_y_rel_local.nut"`);
        expect(output).toContain('// y.nut (case y rel)\n');
      } else {
        console.log(LOCAL_REPO_NOT_DEFINED_MESSAGE);
      }
    });
  });
});

describe('Remote relative option is not enabled - ', () => {

  let builder;
  const contextPath = path.resolve(__dirname + "/../fixtures/include/sample-2/").replace(/\\/g, '/');

  beforeEach(() => {
    builder = new Builder();
    builder.machine.remoteRelativeIncludes = false;
    builder.machine.path = contextPath;
    builder.machine.readers.github.username = process.env.SPEC_GITHUB_USERNAME;
    builder.machine.readers.github.token = process.env.SPEC_GITHUB_PASSWORD || process.env.SPEC_GITHUB_TOKEN;
    builder.machine.clearCache = true;
    builder.logger = new Log(process.env.SPEC_LOGLEVEL || 'error');
  });

  describe('X path by https link - ', () => {

    const httpsPath = "https://raw.githubusercontent.com/EatonGMBD/Builder/feature/ADO-310-includes-enhancement/spec/fixtures/include/sample-2";

    it('should search Y file by local abs path', () => {
      try {
        fs.accessSync("/", fs.constants.W_OK);
        if (fs.existsSync(`/${TEST_DIR_NAME}`)) {
          fs.unlinkSync(`/${TEST_DIR_NAME}/y.nut`);
          fs.rmdirSync(`/${TEST_DIR_NAME}`, { recursive: true });
        }
        fs.mkdirSync(`/${TEST_DIR_NAME}`);
        fs.writeFileSync(`/${TEST_DIR_NAME}/y.nut`, "// y.nut (case y abs)\n");
        let output = builder.machine.execute(`@include "` + httpsPath + `/LibA/dirX/x_case_y_abs_local_slash2.nut"`);
        fs.unlinkSync(`/${TEST_DIR_NAME}/y.nut`);
        fs.rmdirSync(`/${TEST_DIR_NAME}`, { recursive: true });
        expect(output).toContain('// y.nut (case y abs)\n');
      }
      catch (err) {
        console.log(NO_ROOT_PERMISSION_MESSAGE);
      }
    });
  });

  describe('X path by remote repo - ', () => {

    const githubPath = "github:EatonGMBD/Builder/spec/fixtures/include/sample-2";

    it('should search Y file in remote repository', () => {
      let output = builder.machine.execute(`@include "` + githubPath + `/LibA/dirX/x_case_y_github.nut@feature/ADO-310-includes-enhancement"`);
      expect(output).toContain('// y.nut (case y remote)\n');
    });
  });

  describe('X path by local repo - ', () => {

    it('should search Y file in remote repository', () => {
      if (process.env.SPEC_GIT_LOCAL_REPO_PATH != undefined) {
        let output = builder.machine.execute(`@include "git-local:${process.env.SPEC_GIT_LOCAL_REPO_PATH}/spec/fixtures/include/sample-2/LibA/dirX/x_case_y_https.nut"`);
        expect(output).toContain('// y.nut (case y remote)\n');
      } else {
        console.log(LOCAL_REPO_NOT_DEFINED_MESSAGE);
      }
    });

    it('should search Y file by local abs path', () => {
      if (process.env.SPEC_GIT_LOCAL_REPO_PATH != undefined) {
        try {
          fs.accessSync("/", fs.constants.W_OK);
          if (fs.existsSync(`/${TEST_DIR_NAME}`)) {
            fs.unlinkSync(`/${TEST_DIR_NAME}/y.nut`);
            fs.rmdirSync(`/${TEST_DIR_NAME}`, { recursive: true });
          }
          fs.mkdirSync(`/${TEST_DIR_NAME}`);
          fs.writeFileSync(`/${TEST_DIR_NAME}/y.nut`, "// y.nut (case y abs)\n");
          let output = builder.machine.execute(`@include "git-local:${process.env.SPEC_GIT_LOCAL_REPO_PATH}/spec/fixtures/include/sample-2/LibA/dirX/x_case_y_abs_local_slash2.nut"`);
          fs.unlinkSync(`/${TEST_DIR_NAME}/y.nut`);
          fs.rmdirSync(`/${TEST_DIR_NAME}`, { recursive: true });
          expect(output).toContain('// y.nut (case y abs)\n');
        }
        catch (err) {
          console.log(NO_ROOT_PERMISSION_MESSAGE);
        }
      } else {
        console.log(LOCAL_REPO_NOT_DEFINED_MESSAGE);
      }
    });
  });

  describe('X path by abs path - ', () => {

    it('should search Y file in remote repository', () => {
      let output = builder.machine.execute(`@include "${backslashToSlash(__dirname)}/../fixtures/include/sample-2/LibA/dirX/x_case_y_github.nut"`);
      expect(output).toContain('// y.nut (case y remote)\n');
    });

    it('should search Y file by web link', () => {
      let output = builder.machine.execute(`@include "${backslashToSlash(__dirname)}/../fixtures/include/sample-2/LibA/dirX/x_case_y_https.nut"`);
      expect(output).toContain('// y.nut (case y remote)\n');
    });

    it('should search Y file by local abs path', () => {
      try {
        fs.accessSync("/", fs.constants.W_OK);
        if (fs.existsSync(`/${TEST_DIR_NAME}`)) {
          fs.unlinkSync(`/${TEST_DIR_NAME}/y.nut`);
          fs.rmdirSync(`/${TEST_DIR_NAME}`, { recursive: true });
        }
        fs.mkdirSync(`/${TEST_DIR_NAME}`);
        fs.writeFileSync(`/${TEST_DIR_NAME}/y.nut`, "// y.nut (case y abs)\n");
        let output = builder.machine.execute(`@include "${backslashToSlash(__dirname)}/../fixtures/include/sample-2/LibA/dirX/x_case_y_abs_local_slash2.nut"`);
        fs.unlinkSync(`/${TEST_DIR_NAME}/y.nut`);
        fs.rmdirSync(`/${TEST_DIR_NAME}`, { recursive: true });
        expect(output).toContain('// y.nut (case y abs)\n');
      }
      catch (err) {
        console.log(NO_ROOT_PERMISSION_MESSAGE);
      }
    });
  });
});
