@ lib_a is a string
@{lib_a}

@ lib_a is a string-returning function
@{lib_b()}

@ lib_c is an object with two functions...

@ ...one transforms a string
@{lib_c.upper("an upper-case string")}
@{"an upper-case string" | lib_c.upper}

@ ...one increments and returns a number
@{lib_c.counter()}
@{lib_c.counter()}
@{lib_c.counter()}

@ lib_d has a logging function which outputs nothing
@{lib_d.log("Hello world!")}

@ lib_e has an instantiated object with a .testThis() method
@ currently method binding does not work properly
@{lib_e.object.testThis()}
