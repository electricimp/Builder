# Include Example #

This example shows how to use Builder's GitHub remote `@include` with `--use-remote-relative-includes`. We have a sample project directory with multiple folders and files. Buried in the src folder directories are a main agent and a main device file that both use `@include` statements. Using Builder's [command line installation](../../README.md#command-line-tool-installation) and this GitHub repository run the following commands locally to create an agent and device file. 

Command to the agent file:

```
pleasebuild github:electricimp/Builder/examples/includeExample/src/agent/main.agent.nut --use-remote-relative-includes
```

Produces output: 

```
// ----------------------------------------------------
// FILE: main.agent.nut
// PATH: examples/includeExample/src/agent

// Main agent file:
// Path from Project root directory: Builder/examples/includeExample/src/agent/main.agent.nut

// ----------------------------------------------------
// FILE: constants.shared.nut
// PATH: examples/includeExample/src/shared

// Shared constants:
// Path from Project root directory: Builder/examples/includeExample/src/shared/constants.shared.nut

const MM_READING = "r";
// ----------------------------------------------------
// ----------------------------------------------------
// FILE: myLibrary.lib.nut
// PATH: examples/includeExample/libs

// My local library file 
// Path from Project root directory: Builder/examples/includeExample/libs/myLibrary.lib.nut

class MyLib {
    static VERSION = "1.0.0";

    constructor() {
        server.log("My library version: " + VERSION);
    }
}
// ----------------------------------------------------

server.log("Main agent file running...");
// ----------------------------------------------------
```

Command to the device file:

```
pleasebuild github:electricimp/Builder/examples/includeExample/src/device/main.device.nut --use-remote-relative-includes
```

Produces output: 

```
// ----------------------------------------------------
// FILE: main.device.nut
// PATH: examples/includeExample/src/device

// Main agent file:
// Path from Project root directory: Builder/examples/includeExample/src/device/main.device.nut

// ----------------------------------------------------
// FILE: constants.shared.nut
// PATH: examples/includeExample/src/shared

// Shared constants:
// Path from Project root directory: Builder/examples/includeExample/src/shared/constants.shared.nut

const MM_READING = "r";
// ----------------------------------------------------
// ----------------------------------------------------
// FILE: myLibrary.lib.nut
// PATH: examples/includeExample/libs

// My local library file 
// Path from Project root directory: Builder/examples/includeExample/libs/myLibrary.lib.nut

class MyLib {
    static VERSION = "1.0.0";

    constructor() {
        server.log("My library version: " + VERSION);
    }
}
// ----------------------------------------------------

server.log("Main device file running...");
// ----------------------------------------------------
```
