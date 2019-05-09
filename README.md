<img src=docs/logo.png?2 width=180 alt=Builder><br />

*Builder* combines a preprocessor with an expression language and advanced imports.

**Current version: 2.8.1**

![Build Status](https://cse-ci.electricimp.com/app/rest/builds/buildType:(id:Builder_BuildAndTest)/statusIcon)

## Contents ##

- [Builder Syntax](#builder-syntax)
    - [Expressions](#expressions)
        - [Types](#types)
        - [Operators](#operators)
            - [Binary](#binary)
            - [Unary](#unary)
        - [Member Expressions](#member-expressions)
        - [Conditional Expressions](#conditional-expressions)
        - [Variables](#variables)
            - [Variable Definition Order](#variable-definition-order)
            - [Environment Variables](#environment-variables)
            - [Builder Variables](#builder-variables)
        - [Builder Functions](#builder-functions)
    - [Comments](#comments)
    - [Directives](#directives)
        - [@{...} – Inline Expressions/Macros](#-inline-expressionsmacros)
        - [@set](#set)
        - [@macro](#macro)
        - [@include](#include)
            - [GitHub Authentication](#github-authentication)
            - [TBD Nested Includes](#nested-includes-scope)
        - [@include once](#include-once)
        - [@while](#while)
        - [@repeat](#repeat)
        - [@if... @elseif... @else](#if-elseeif-else)
        - [@error](#error)
        - [@warning](#warning)
    - [Filters](#filters)
- [Builder Usage](#builder-usage)
    - [Installing And Running Builder](#installing-and-running-builder)
        - [Command Line Tool Installation](#command-line-tool-installation)
        - [Library Installation](#library-installation)
    - [Reproducible Artifacts](#reproducible-artifacts)
        - [GitHub Files: Dependencies](#github-files-dependencies)
        - [Builder Variables: Directives](#builder-variables-directives)
    - [Including JavaScript Libraries](#including-javascript-libraries)
        - [Binding The Context Object Correctly](#binding-the-context-object-correctly)
    - [Remote Includes](#remote-includes)
        - [Caching Remote Includes](#caching-remote-includes)
        - [Proxy Access To Remote Includes](#proxy-access-to-remote-includes)
        - [Local Includes From Remote Files](#local-includes-from-remote-files)
- [Testing](#testing)
- [License](#license)

# Builder Syntax #

## Expressions ##

### Types ###

The following types are supported in expressions:

- _numbers_ (eg. `1`, `1E6`, `1e-6`, `1.567`)
- _strings_ (eg. `"abc"`, `'abc'`)
- `null`
- `true`
- `false`

### Operators ###

#### Binary ####

`||`&nbsp;&nbsp;`&&`&nbsp;&nbsp;`==`&nbsp;&nbsp;`!=`&nbsp;&nbsp;`<`&nbsp;&nbsp;`>`&nbsp;&nbsp;`<=`&nbsp;&nbsp;`>=`&nbsp;&nbsp;`+`&nbsp;&nbsp;`-`&nbsp;&nbsp;`*`&nbsp;&nbsp;`/`&nbsp;&nbsp;`%`

#### Unary ####

`+`&nbsp;&nbsp;`-`&nbsp;&nbsp;`!`

### Member Expressions ###

- `somevar.member`
- `somevar["member"]`
- `([1, 2, 3])[1]`

### Conditional Expressions ###

`conditional ? if_true : if_false`

### Variables ###

Variables can be used in Builder expression evaluation. Variable names can contain `$`, `_`, latin letters and digits, however they must not start with a digit. Variables can be defined in the following ways:

- Builder's [`@set` directive](#set) statement.
- Your computer's [environment variable](#environment-variables).
- Builder's command line parameter `-D<variable name> <variable value>` passed to the `pleasebuild` command

All undefined variables are evaluated as `null`.

#### Variable Definition Order ####

When resolving a variable’s value: 

1. Builder first looks for its definition in the command line -D parameters (`-D<variable name> <variable value>`) passed to the `pleasebuild` command.
2. If no such variable definition is found, the code is scanned for `@set` directive statements preceding the variable usage.
3. If no variable definitions are found in the previous steps, Builder looks in the host environment variables.

#### Environment Variables ####

There is no special predicate required to make use of environment variables. Builder looks in the host environment variables to try and resolve the expressions if no command line or local variables have been set.   

For example on a mac:

```
server.log("Host home path is @{HOME}");
```

will print the home directory path of the current user of the system where Builder was executed.

Environment variables differ based on OS. If you wish to use environment variables with Builder, a quick internet search will give you details on how to *list* the variables currently available on your system and also how to *set* new variables.

#### Builder Variables ####

- **`__LINE__`**  The line number (relative to the file in which this variable appears).

```
Hi from line @{__LINE__}!
```

- **`__FILE__`**  The name of the file in which this variable appears.

```
Hi from file @{__FILE__}!
```

- **`__PATH__`**  The absolute path (not including file name) to the file where this variable appears. Can contain a URL for remote includes.

```
Hi from file @{__PATH__}!
```

Builder has two directives [`@while`](#while) and [`@repeat`](#repeat) that create loops. Inside these loops the following variables are available: 

- `loop.index` &mdash; 0-indexed iteration counter
- `loop.iteration` &mdash; 1-indexed iteration counter

Usage examples for these variables can be found in the [`@while`](#while) and [`@repeat`](#repeat) directive examples.

### Builder Functions ###

Builder has a handful of helper functions.

- `defined(<variable_name>)` &mdash; returns `true` if a variable is defined, `false` otherwise.
- `include(<source>)` &mdash; includes external source.
- `escape(<value>)` &mdash; escapes special characters in string (`\b`, `\f`, `\n`, `\r`, `\t`,  `\`, `'`, `"`).
- `base64(<value>)` &mdash; encodes value as base64.
- `min(<numbers>)` &mdash; returns a number equal to the lowest number parameter 
- `max(<numbers>)` &mdash; returns a number equal to the highest number parameter
- `abs(<number>)` &mdash; returns the absolute value of the number parameter

Builder also comes with some string functions, based on the JavaScript methods of the same names. These functions are available under the namespace `S`. The first argument of each function is always the string to be operated on. For documentation on the remaining arguments, please see [‘JavaScript String Methods’](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String).

- `S.concat()`
- `S.endsWith()`
- `S.includes()`
- `S.repeat()`
- `S.split()`
- `S.startsWith()`
- `S.substr()`
- `S.substring()`
- `S.toLowerCase()`
- `S.toUpperCase()`
- `S.trim()`
- `S.trimLeft()`
- `S.trimRight()`

## Comments ##

Lines starting with `@` followed by space or a line break are treated as comments and not added to the output.

```
@ This is a Builder comment and will not appear in the output
```

All text after any *Builder* expression statement, starting with `//` and extending to the end of the line, will be ignored by *Builder* and will not appear in the result output.

```
@set SOME_STRING = "my string" // This is a Builder comment that will not appear in output
```

## Directives ##

All *directives* start with the `@` symbol. The following sections will describe how to use directives to compile Electric Imp squirrel code.

### @{...} Inline Expressions/Macros ###

This directive inserts the value of the enclosed variable, expression or result from executing a macro. 

<pre><b><b>@{</b></b><i>&lt;variable:identifier&gt;</i><b><b>}</b></b></pre>

<pre><b>@{</b><i>&lt;expression&gt;</i><b>}</b></pre>

<pre><b>@{</b>macro(a, b, c)<b>}</b></pre>

#### Example ####

```
The result is: @{123 * 456}.
```

This results in the following output:

```
The result is: 56088.
```

### @set ###

This directive assigns a *value* or the value of an *expression* to a *variable*. Variables are defined in a global context. A *value* can be any supported [expression type](#types) or [Builder function](#builder-functions).

<pre>
<b><b>@set</b></b> <i>&lt;variable:identifier&gt;</i> <i>&lt;value:expression&gt;</i>
</pre>

<pre>
<b><b>@set</b></b> <i>&lt;variable:identifier&gt;</i> = <i>&lt;value:expression&gt;</i>
</pre>

#### Example ####

Set variables using Builder `@set` directive, then use the Builder inline [`@{...}`](#-inline-expressionsmacros) to create squirrel log messages with those variables. 

```
@ Set Builder global variables
@set SOME_INT    = 10
@set SOME_STRING = "my string"
@set BOOL_VAL    = (12 > 4)
@ 
@ Use a Builder function to set a global variable
@set MIN_INT min(1, 2, 3)
@ 
// Use Builder global variables in squirrel log messages
server.log(@{SOME_INT});
server.log("@{SOME_STRING}");
server.log(@{BOOL_VAL});
server.log(@{MIN_INT});
```

This results in the following output:

```
// Use Builder global variables in squirrel log messages
server.log(10);
server.log("my string");
server.log(true);
server.log(1);
```

### @macro ###

This directive defines a code block that can take its own parameters. Macros are declared in a global scope. Macro parameters are only available within the macro scope and override global variables with the same name (but do not affect them).

#### Define ####

<pre>
<b>@macro</b> <i>&lt;name&gt;</i>(<i>&lt;arguments&gt;</i>)
  <i>&lt;body&gt;</i>
<b>@endmacro</b>
</pre>

`@endmacro` can be replaced with `@end`.

#### Use ####

 Macros can be used either inline [`@{...}`](#-inline-expressionsmacros) or via the [@include](#include) directive. When macros are used inline no line-control statements are generated for the output inside the macro scope and trailing newlines are trimmed from the macro output.

- Inline `@{...}`:

	<pre><b>@{</b>macro(a, b, c)<b>}</b></pre>

- With `@include` directive

    <pre><b>@include</b> macro(a, b, c)</pre>

#### Inline Example ####

Define macro and use the inline [`@{...}`](#-inline-expressionsmacros) directive to create a multi-line string to log in squirrel. 

```
@ Define a macro
@macro some_macro(a, b, c)
    Hello, @{a}!
    Roses are @{b},
    And violets are @{c} 
@end
@
// Use an inline Builder macro to create a multi-line string
poem <- @"@{some_macro("username", "red", "blue")}";
server.log(poem);
```

This results in the following output:

```
// Use an inline Builder macro to create a multi-line string
poem <- @"    Hello, username!
    Roses are red,
    And violets are blue";
server.log(poem);
```

#### Include Example ####

Define macro and use if in an `@include` directive to create a multi-line string to log in squirrel.

```
@ Define a macro
@macro some_macro(a, b, c)
    Hello, @{a}!
    Roses are @{b},
    And violets are @{c} 
@end
@
// Use Builder include and macro directives to create a multi-line squirrel string
poem <- @"
@include some_macro("username", "red", "blue")
";
server.log(poem);
```

This results in the following output:

```
// Use Builder include and macro directives to create a multi-line squirrel string
poem <- @"
    Hello, username!
    Roses are red,
    And violets are blue
";
server.log(poem);
```

#### Optional Parameter Example ####

Use a [Builder function](#builder-functions) to configure and use a macro with an optional parameter.

```
@ Define a macro with an optional parameter
@macro some_macro(a, b, c)
    Hello, @{a}!
    Roses are @{b},
    And violets are @{defined(c) ? c : "of undefined color"}. 
@end
@
// Use Builder include and macro directives to create a multi-line squirrel string
poem <- @"
@include some_macro("username", "red")
";
server.log(poem);
```

This results in the following output:

```
// Use Builder include and macro directives to create a multi-line squirrel string
poem <- @"
    Hello, username!
    Roses are red,
    And violets are of undefined color. 
";
server.log(poem);
```

### @include ###

This directive can be used to include local files, external sources, or macros.

<pre>
<b>@include</b> <i>&lt;source:expression&gt;</i>
</pre>

- For `@macro` directive

    <pre><b>@include</b> some_macro("username", 123)</pre>

- For a local file

    <pre><b>@include</b> "somefile.ext"</pre>

- For a remote file

    <pre><b>@include</b> "http://example.com/file.ext"</pre>

    <pre><b>@include</b> "https://example.com/file.ext"</pre>

- For a file from GitHub

    - `user` is the user/organization name.
    - `repo` is the repository name.
    - `ref` is the git reference (branch name or tag, defaults to _master_).

    <pre><b>@include</b> "github:<i>&lt;user&gt;</i>/<i>&lt;repo&gt;</i>/<i>&lt;path&gt;</i>[@<i>&lt;ref&gt;</i>]"</pre>

    - Head of the default branch

    <pre><b>@include</b> "github:electricimp/Promise/promise.class.nut"</pre>

    - Head of the _develop_ branch
    
    <pre><b>@include</b> "github:electricimp/Promise/promise.class.nut@develop"</pre>

    - Tag _v3.0.1_:
    
    <pre><b>@include</b> "github:electricimp/Promise/promise.class.nut@v3.0.1"</pre>

#### GitHub Authentication ####

When using GitHub `@includes`, authentication is optional. However, you should bear in mind that:

- If you use authentication, the GitHub API provides much higher rate limits.
- Authentication is required to access private repositories.

Apart from a GitHub *username*, you need to provide either a *[personal access token](https://github.com/settings/tokens)* **or** *password* (which is less secure and not recommended). More information on how to provide those parameters is included in the [Builder usage](#builder-usage) section.

#### Nested Includes/ Scope ####

TODO: add info and examples for what happens when includes are nested in files that are themselves included.

### @include once ###

This acts the same as `@include` but has no effect if *source* has already been included. Macros are always included.

<pre><b>@include once</b> <i>&lt;source:expression&gt;</i></pre>

### @while ###

This invokes a `while` loop. You can access the Builder loop variables in `@while` loops.

<pre>
<b>@while</b> <i>&lt;test:expression&gt;</i>
  // 0-based iteration counter: <b>@{</b>loop.index<b>}</b>
  // 1-based iteration counter: <b>@{</b>loop.iteration<b>}</b>
<b>@endwhile</b>
</pre>

**Note** `@endwhile` can be replaced with `@end`.

#### Example ####

```
@set myvar = 12

@while myvar > 9
  @set myvar = myvar - 1
  var: @{myvar}
  loop.index: @{loop.index}
@end
```

This outputs:

```
myvar: 11
loop.index: 0
myvar: 10
loop.index: 1
myvar: 9
loop.index: 2
```

### @repeat ###

This invokes a loop that repeats over a certain number of iterations. You can access the Builder loop variables in `@repeat` loops.

<pre>
<b>@repeat</b> <i>&lt;times:expression&gt;</i>
  // 0-based iteration counter: <b>@{</b>loop.index<b>}</b>
  // 1-based iteration counter: <b>@{</b>loop.iteration<b>}</b>
<b>@endrepeat</b>
</pre>

**Note** `@endrepeat` can be replaced with `@end`.

#### Example ####

```
@repeat 3
  loop.iteration: @{loop.iteration}
@end
```

This outputs:

```
  loop.iteration: 1
  loop.iteration: 2
  loop.iteration: 3
```

<a id="if-elseeif-else"></a>
### @if... @elseif... @else ###

This directive invokes conditional branching.

```
@if <test:expression>

  // Consequent code

@elseif <test:expression>

  // else if #1 code

// ...more elseifs...

@else

  // Alternative code

@endif
```

**Note** `@endif` can be replaced with `@end`.

#### Example ####

```
@if __FILE__ == 'abc.ext'
  // include something
@elseif __FILE__ == 'def.ext'
  // include something else
@else
  // something completely different
@endif
```

### @error ###

<pre>
<b>@error</b> <i>&lt;message:expression&gt;</i>
</pre>

Emits an error.

#### Example ####

```
@if PLATFORM == "platform1"
  // platform 1 code
@elseif PLATFORM == "platform2"
  // platform 2 code
@elseif PLATFORM == "platform3"
  // platform 3 code
@else
  @error "Platform is " + PLATFORM + " is unsupported"
@endif
```

### @warning ###

<pre>
<b>@warning</b> <i>&lt;message:expression&gt;</i>
</pre>

Emits a warning.

#### Example ####

```
@if PLATFORM == "platform1"
  // platform 1 code
@elseif PLATFORM == "platform2"
  // platform 2 code
@elseif PLATFORM == "platform3"
  // platform 3 code
@else
  @warning "Building for default platform"
  // default platform code
@endif
```

## Filters ##

The `|` operator (filter) allows you to pass a value through any of the supported functions.

<pre>
<b>@{</b>&lt;expression&gt;</i> | <i>&lt;filter&gt;</i><b>}</b>
</pre>

This is equivalent to:

<pre>
<b>@{</b><i>&lt;filter&gt;(&lt;expression&gt;)</i><b>}</b>
</pre>

### Example ###

```
// Include external HTML to a string
a = "@{include('index.html')|escape}"

// Include external binary file to a base64-encoded string
b = "@{include('file.bin')|base64}"
```

# Builder Usage #

## Installing And Running Builder ##

Builder requires Node.js 8.0.0 and above. It can be installed and used by two ways: as an _npm_ command line tool or as an _npm_ library.

### Command Line Tool Installation ###

Install Builder

```sh
npm install -g Builder
```

then use the `pleasebuild` command which is provided by Builder:

```
pleasebuild [-l] [-D<variable> <value>]
    [--github-user <username> --github-token <token>]
    [--lib <path_to_file>]
    [--use-remote-relative-includes] [--suppress-duplicate-includes-warning]
    [--cache] [--clear-cache] [--cache-exclude-list <path_to_file>]
    [--save-dependencies [<path_to_file>]] [--use-dependencies [<path_to_file>]]
    [--save-directives [<path_to_file>]] [--use-directives [<path_to_file>]]
    <input_file>
```

where:

`<input_file>` &mdash; is the path to source file which should be preprocessed

and the options are:

| Option | Synonym | Mandatory? | Value&nbsp;Required? | Description |
| --- | --- | --- | --- | --- |
| -l |  | No | No | Generates line control statements. For a more detailed explanation, please read [this GCC page](https://gcc.gnu.org/onlinedocs/gcc-4.5.4/cpp/Line-Control.html) |
| -D&lt;variable&gt; | | No | Yes | Defines a [variable](#variables). May be specified several times to define multiple variables |
| --github-user | | No | Yes | A GitHub username. |
| --github-token | | No | Yes | A GitHub [personal access token](https://github.com/settings/tokens) or password (not recommended). Should be specified if the `--github-user` option is specified. |
| --lib | --libs | No | Yes | Include the specified [JavaScript file(s) as a library](#including-javascript-libraries). May be specified several times to include multiple libraries. The provided value may specify a concrete file or a directory (all files from the directory will be included). The value may contain [wildcards](https://www.npmjs.com/package/glob) (all matched files will be included) |
| --use-remote-relative-includes | | No | No | Interpret every [local include](#include) as relative to the location of the source file where it is mentioned. See ['Local Includes From Remote Files'](#local-includes-from-remote-files) |
| --suppress-duplicate-includes-warning | --suppress-duplicate | No | No | Do not show a warning if a source file with the same content was included multiple times from different locations and this results in code duplication |
| --cache | -c | No | No | Turn on caching for all files included from remote resources. This option is ignored if the `--save-dependencies` or `--use-dependencies` options are specified. See [‘Caching Remote Includes’](#caching-remote-includes) |
| --clear-cache | | No | No | Clear the cache before Builder starts running. See [‘Caching Remote Includes’](#caching-remote-includes) |
| --cache-exclude-list | | No | Yes | Set the path to the file that lists resources which should not be cached. See [‘Caching Remote Includes’](#caching-remote-includes) |
| --save-dependencies | | No | No | Save references to the required GitHub files in the specified file. If a file name is not specified, the `dependencies.json` file in the local directory is used. See [‘Reproducible Artifacts’](#reproducible-artifacts) |
| --use-dependencies | | No | No | Use the specified file to set which GitHub files are required. If a file name is not specified, the `dependencies.json` file in the local directory is used. See [‘Reproducible Artifacts’](#reproducible-artifacts).  |
| --save-directives | | No | No | Save Builder variable definitions in the specified file. If a file name is not specified, the `directives.json` file in the local directory is used. See [‘Reproducible Artifacts’](#reproducible-artifacts) |
| --use-directives | | No | No | Use Builder variable definitions from the specified file. If a file name is not specified, the `directives.json` file in the local directory is used. See [‘Reproducible Artifacts’](#reproducible-artifacts) |

### Library Installation ###

Install Builder

```sh
npm i --save Builder
```

then instantiate, setup and execute Builder from the source code, for example:

```js
const Builder = require('Builder');
const builder = new Builder();

// Specify whether you need line control statements. See the "-l" CLI option.
builder.machine.generateLineControlStatements = <true|false>;

// Cache all files included from remote sources. See the "--cache" CLI option.
builder.machine.useCache = <true|false>;

// Set GitHub credentials. See the "--github-user" and "--github-token" CLI options.
builder.machine.readers.github.username = "<USERNAME>";
builder.machine.readers.github.token = "<PASSWORD_OR_ACCESS_TOKEN>";

// Path to the file that lists the resources which should be excluded from caching.
// See the "--cache-exclude-list" CLI option.
builder.machine.excludeList = "<PATH_TO_FILE>";

// Replace local include paths to github URLs if requested.
// See the "--use-remote-relative-includes" CLI option.
builder.machine.remoteRelativeIncludes = <true|false>;

// Suppress warning about duplicate includes.
// See the "--suppress-duplicate-includes-warning" CLI option.
builder.machine.suppressDupWarning = <true|false>;

// See the "--save-dependencies" CLI option.
builder.machine.dependenciesSaveFile = <false|"PATH_TO_FILE">;
// See the "--use-dependencies" CLI option.
builder.machine.dependenciesUseFile = <false|"PATH_TO_FILE">;

// See the "--save-directives" CLI option.
builder.machine.directivesSaveFile = <false|"PATH_TO_FILE">;
// See the "--use-directives" CLI option.
builder.machine.directivesUseFile = <false|"PATH_TO_FILE">;

const inputFile = "PATH_TO_YOUR_INPUT_FILE";

const result = builder.machine.execute(`@include "${inputFile}"`);
console.log(result);
```

To understand Builder setup, please review [this source code](./src/cli.js).

## Reproducible Artifacts ##

It is possible to save the build configuration used for preprocessing a source file &mdash; ie. Builder variable definitions and references to the concrete versions of GitHub files and libraries that are used &mdash; and preprocess the source file again later with the saved configuration.

### GitHub Files: Dependencies ###

`--save-dependencies [<path_to_file>]` and `--use-dependencies [<path_to_file>]` options are used to save and to reuse, respectively, references to concrete versions of GitHub files and libraries. The references are saved in a JSON file. If a file name is not specified, the `dependencies.json` file in the local directory is used. Every reference consists of GitHub file URL and Git Blob ID (Git Blob SHA). For more information, please see [the Git Manual](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects) and [the Git API](https://developer.github.com/v3/git/blobs/).

**Note** It is possible to obtain the Git Blob ID of a GitHub file using the following *git* command: `git hash-object <path_to_file>`

These options are processed the following way:

- If only `--save-dependencies [<path_to_file>]` is specified, the references to all source files retrieved from GitHub are saved in the provided JSON file (or `dependencies.json`).
- If only `--use-dependencies [<path_to_file>]` is specified, the source files from GitHub are retrieved using the references read from the provided JSON file (or `dependencies.json`).
- If both `--save-dependencies [<path_to_file>]` and `--use-dependencies [<path_to_file>]` are specified, then:
    1. The source files from GitHub are retrieved using the references read from the JSON file passed to the `--use-dependencies` option (or `dependencies.json`).
    2. If the source code contains @includes for files from GitHub which have not yet been retrieved, they are retrieved now.
    3. Builder performs the preprocessing operation.
    4. References to all source files retrieved from GitHub are saved in the JSON file passed to the `--save-dependencies` option (or `dependencies.json`).

**Note** If either `--save-dependencies` or `--use-dependencies` is specified, the `--cache` option is ignored.

A typical `dependencies.json` file looks like this:

```json
[
  [
    "github:repositoryA/ProjectA/fileA",
    "2ff017dc92e826ad184f9cdeadd1a2446f8d6032"
  ],
  [
    "github:repositoryB/ProjectB/fileB",
    "a01b64f9ce764f226f52c6b9364396d4a8bd550b"
  ]
]
```

### Builder Variables: Directives ###

The `--save-directives [<path_to_file>]` and `--use-directives [<path_to_file>]` options are used to, respectively, save and reuse Builder variable definitions. The definitions are saved in a JSON file. If a file name is not specified, the `directives.json` file in the local directory is used. These options are processed the similar way as the `--save-dependencies` and `--use-dependencies` options, above.

When the `--use-directives [<path_to_file>]` option is used, the saved Builder variable definitions are merged with definitions specified by `-D<variable> <value>` options.

A typical `directives.json` file looks like this:

```json
{
  "Variable0": "value0",
  "Variable1": "value1"
}
```

## Including JavaScript Libraries ##

Builder can accept JavaScript libraries to add functionality to its global namespace. The library should export an object, the properties of which will be merged into the global namespace. For example, to include a function to convert strings to uppercase, define your library file like so:

```js
module.exports = {
  upper: (s) => s.toUpperCase()
};
```

Include directives, such as the following example, in your input file:

```
@{upper("warning:")}
@{upper(include("warning.txt"))}
```

Run builder with the option `--lib path/to/your/lib/file`.

### Binding The Context Object Correctly ###

Functions called by Builder will be called with their *this* argument set to a Builder context object. Within the context object, Builder [variables](#variables) like `__FILE__`, [functions](#builder-functions) like `max()`, and other included library functions will be made available at the top level. Variables defined in your input code with `@macro` or `@set` will be available under the key *globals*.

Ignoring the binding of *this* may cause unexpected behavior, for example when calling methods on objects. Take the following example library:

```js
class MyClass {
    constructor(str) {
        this._str = str;
    }

    getStr() {
        return this._str;
    }
}

myObject = MyClass("my text");

module.exports = {
    myObject
};
```

Attempting to use this library with the directive `@{myObject.getStr()}` will not deliver the expected behavior because *this* in *getStr()* will be set to a Builder context object and not to *myObject*. When calling class methods ensure they have been bound to the correct value of *this*:

```js
class MyClass {
    constructor(str) {
        this._str = str;
    }

    getStr() {
        return this._str;
    }
}

myObject = MyClass("my text");

module.exports = {
    getStr: myObject.getStr.bind(myObject)
};
```

## Remote Includes ##

### Caching Remote Includes ###

To reduce compilation time, Builder can optionally cache files included from a remote resource (ie. GitHub or remote HTTP/HTTPs servers).

If this file cache is enabled, remote files are cached locally in the *.builder-cache* folder. Cached resources expire and are automatically invalidated 24 hours after their addition to the cache.

To turn the cache on, pass the `--cache` or `-c` option to Builder. If this option is not specified, Builder will not use the file cache even if the cached data exist and is valid &mdash; it will query remote resources on every execution.

To reset the cache, use both the `--cache` and the `--clear-cache` options.

If a resource should never be cached, it needs to be added to the *exclude-list.builder* file (see example below). You can use wildcard characters to mask file names.

#### Wildcard Pattern Matching ####

Pattern matching syntax is a similar to that of *.gitignore*. A string is a wildcard pattern if it contains '```?```' or '```*```' characters. Empty strings or strings that starts with '```#```' are ignored.

A '```?```' symbol matches any single character. For example, `bo?t.js` matches `boot.js` and `boat.js`, but doesn't match `bot.js`.

A '```*```' matches any string, that is limited by slashes, including the empty string. For example, ```/foo/*ar``` matches `/foo/bar`, `/foo/ar` and `/foo/foo-bar`, but doesn't match `/foo/get/bar` or `/foo/bar/get`.

Two consecutive asterisks `**` in patterns matched against full pathname may have special meaning:

* A leading `**` followed by a slash means match in all directories. For example, `**/foo` matches file or directory `foo` anywhere, the same as pattern `foo`. `**/foo/bar` matches file or directory `bar` anywhere that is directly under directory `foo`.

* A trailing `/**` matches everything inside. For example, `abc/**` matches all files inside directory `abc`.

* A slash followed by two consecutive asterisks then a slash matches zero or more directories. For example, `a/**/b` matches `a/b`, `a/x/b`, `a/x/y/b` and so on.

* Other consecutive asterisks are considered invalid.

#### Example ####

```sh
# Avoid caching a specific file
github:electricimp/MessageManager/MessageManager.lib.nut

# Exclude all electricimp repos
github:electicimp/**

# Exclude all tagged files or files from the specific branches from the cache
github:*/**/*@*
```

### Proxy Access To Remote Includes ###

To specify a proxy that should be used when you are including files from remote resources (ie. GitHub or remote HTTP/HTTPs servers), set the environment variables `HTTP_PROXY`/`http_proxy` and/or `HTTPS_PROXY`/`https_proxy` for HTTP and HTTPS protocols respectively.

For example, to operate through a proxy running at IP address 192.168.10.2 on port 3128 for HTTP requests, you should set the environment variable: `HTTP_PROXY='http://192.168.10.2:3128'`. All of Builder’s HTTP requests will now go through the proxy.

**Note** Files retrieved from GitHub (`github:` protocol) are always accessed using HTTPS. So when specifying a proxy in this case, make sure you use set the `HTTPS_PROXY` environment variable.

### Local Includes From Remote Files ###

By default, all [local includes](#include), even if they are mentioned in remote source files, are interpreted as relative to the system where Builder is running.

If `--use-remote-relative-includes` option is specified, every [local include](#include) is interpreted as relative to the location of the source file where it is mentioned, excluding absolute local includes, like `/home/user/etc` or `C:\Users\user\etc`. For example, a local include mentioned in remote source file from GitHub will be downloaded from the same GitHub URL as the source file.

`--use-remote-relative-includes` option does not affect includes with [absolute remote paths](#include).

**Note** In the current Builder version `--use-remote-relative-includes` option affects includes mentioned in remote source files from GitHub only.

# Testing #

All environment variables are optional here. The default for `SPEC_LOGLEVEL` is `error`.

```sh
SPEC_LOGLEVEL=<debug|info|warning|error> 
SPEC_GITHUB_USERNAME=<GitHub username> 
SPEC_GITHUB_TOKEN=<GitHub password/access token> 
npm test
```

# License #

Builder is licensed under the [MIT License](./LICENSE).
