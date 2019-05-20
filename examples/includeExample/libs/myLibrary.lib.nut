// ----------------------------------------------------
// FILE: @{__FILE__}
// PATH: @{__PATH__}

// My local library file 
// Path from Project root directory: Builder/examples/includeExample/libs/myLibrary.lib.nut

class MyLib {
    static VERSION = "1.0.0";

    constructor() {
        server.log("My library version: " + VERSION);
    }
}
// ----------------------------------------------------