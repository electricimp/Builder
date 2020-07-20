// Copyright (c) 2016-2020 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

const Builder = require('../../src');
const backslashToSlash = require('../backslashToSlash');
const Log = require('log');
const path = require('path');
const fs = require('fs');

fdescribe('Remote relative option is enabled - ', () => {

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
        fs.rmdirSync("C:/dirC", { recursive: true });
        fs.mkdirSync("C:/dirC");
        fs.writeFileSync("C:/dirC/y.nut", "// y.nut (case y abs)\n");
        let output = builder.machine.execute(`@include "` + httpsPath + `/LibA/dirX/x_case_y_abs_local.nut"`);
        fs.rmdirSync("C:/dirC", { recursive: true });
        expect(output).toContain('// y.nut (case y abs)\n');
      } else {
        console.log("Windows platform specified test will be skipped");
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
      expect(output).toContain('// y.nut (case y path from \)\n');
    });

    it('should search Y file in remote repository + Y path', () => {
      let output = builder.machine.execute(`@include "` + githubPath + `/LibA/dirX/x_case_y_rel_local.nut@feature/ADO-310-includes-enhancement"`);
      expect(output).toContain('// y.nut (case y rel)\n');
    });
  });

  describe('X path by local repo - ', () => {

    it('should search Y file in remote repository', () => {
      let output = builder.machine.execute(`@include "git-local:${process.env.SPEC_GIT_LOCAL_REPO_PATH}/spec/fixtures/include/sample-2/LibA/dirX/x_case_y_github.nut"`);
      expect(output).toContain('// y.nut (case y remote)\n');
    });

    it('should search Y file in remote repository + Y path', () => {
      let output = builder.machine.execute(`@include "git-local:${process.env.SPEC_GIT_LOCAL_REPO_PATH}/spec/fixtures/include/sample-2/LibA/dirX/x_case_y_rel_local.nut"`);
      expect(output).toContain('// y.nut (case y rel)\n');
    });
  });
});

fdescribe('Remote relative option is not enabled - ', () => {

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
      if (fs.existsSync("/dirC")) {
        fs.unlinkSync("/dirC/y.nut");
        fs.rmdirSync("/dirC", { recursive: true });
      }
      fs.mkdirSync("/dirC");
      fs.writeFileSync("/dirC/y.nut", "// y.nut (case y abs)\n");
      let output = builder.machine.execute(`@include "` + httpsPath + `/LibA/dirX/x_case_y_abs_local_slash2.nut"`);
      fs.unlinkSync("/dirC/y.nut");
      fs.rmdirSync("/dirC", { recursive: true });
      expect(output).toContain('// y.nut (case y abs)\n');
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
      let output = builder.machine.execute(`@include "git-local:${process.env.SPEC_GIT_LOCAL_REPO_PATH}/spec/fixtures/include/sample-2/LibA/dirX/x_case_y_https.nut"`);
      expect(output).toContain('// y.nut (case y remote)\n');
    });

    it('should search Y file by local abs path', () => {
      if (fs.existsSync("/dirC")) {
        fs.unlinkSync("/dirC/y.nut");
        fs.rmdirSync("/dirC", { recursive: true });
      }
      fs.mkdirSync("/dirC");
      fs.writeFileSync("/dirC/y.nut", "// y.nut (case y abs)\n");
      let output = builder.machine.execute(`@include "git-local:${process.env.SPEC_GIT_LOCAL_REPO_PATH}/spec/fixtures/include/sample-2/LibA/dirX/x_case_y_abs_local_slash2.nut"`);
      fs.unlinkSync("/dirC/y.nut");
      fs.rmdirSync("/dirC", { recursive: true });
      expect(output).toContain('// y.nut (case y abs)\n');
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
      if (fs.existsSync("/dirC")) {
        fs.unlinkSync("/dirC/y.nut");
        fs.rmdirSync("/dirC", { recursive: true });
      }
      fs.mkdirSync("/dirC");
      fs.writeFileSync("/dirC/y.nut", "// y.nut (case y abs)\n");
      let output = builder.machine.execute(`@include "${backslashToSlash(__dirname)}/../fixtures/include/sample-2/LibA/dirX/x_case_y_abs_local_slash2.nut"`);
      fs.unlinkSync("/dirC/y.nut");
      fs.rmdirSync("/dirC", { recursive: true });
      expect(output).toContain('// y.nut (case y abs)\n');
    });
  });
});
