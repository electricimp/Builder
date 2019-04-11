<img src=docs/logo.png?2 width=180 alt=Builder><br />

_Builder_ combines a preprocessor with an expression language and advanced imports.

**Current version: 2.7.0**

- [Builder Syntax](#builder-syntax)
    - [Directives](#directives)
        - [@set](#set)
        - [@macro](#macro)
        - [@include](#include)
            - [Macros](#macros)
            - [Local Files](#local-files)
            - [Remote Files](#remote-files)
            - [Files From GitHub](#files-from-github)
            - [Single Line Comments](#single-line-comments)
        - [@include once](#include-once)
        - [@{...} – Inline Expressions/Macros](#inline-expressions-macros)
        - [@while](#while)
        - [@repeat](#repeat)
        - [@if... @elseif... @else](#if-elseeif-else)
        - [@error](#error)
        - [@warning](#warning)
    - [Filters](#filters)
    - [Expressions](#expressions)
        - [Types](#types)
        - [Operators](#operators)
            - [Binary](#binary)
            - [Unary](#unary)
        - [Member Expressions](#member-expressions)
        - [Conditional Expressions](#conditional-expressions)
        - [Variables](#variables)
            - [Variable Definition Order](#variable-definition-order)
            - [\_\_LINE\_\_](#__line__)
            - [\_\_FILE\_\_](#__file__)
            - [\_\_PATH\_\_](#__path__)
            - [Loops](#loops)
            - [Environment Variables](#environment-variables)
        - [Functions](#functions)
    - [Comments](#comments)
- [Builder Usage](#builder-usage)
    - [Running Builder](#running-builder)
        - [As A Command Line Tool](#as-a-command-line-tool)
        - [As A Library](#as-a-library)
    - [Reproducible Artifacts](#reproducible-artifacts)
    - [Including JavaScript Libraries](#including-javascript-libraries)
        - [Binding The Context Object Correctly](#binding-the-context-object-correctly)
    - [Remote Includes](#remote-includes)
        - [Caching Remote Includes](#caching-remote-includes)
        - [Proxy Access To Remote Includes](#proxy-access-to-remote-includes)
- [Testing](#testing)
- [License](#license)

# Builder Syntax #

## Directives ##

Directives start with the <code><b>@</b></code> symbol.

### @set ###

<pre>
<b><b>@set</b></b> <i>&lt;variable:identifier&gt;</i> <i>&lt;value:expression&gt;</i>
</pre>

<pre>
<b><b>@set</b></b> <i>&lt;variable:identifier&gt;</i> = <i>&lt;value:expression&gt;</i>
</pre>

This directive assigns the value of an _expression_ to a _variable_. Variables are defined in a global context.

#### Example ####

Sets *SOMEVAR* to 1:

<pre>
<b>@set</b> SOMEVAR min(1, 2, 3)
</pre>

### @macro ###

<pre>
<b>@macro</b> <i>&lt;name&gt;</i>(<i>&lt;arguments&gt;</i>)
  <i>&lt;body&gt;</i>
<b>@endmacro</b>
</pre>

<code><b>@endmacro</b></code> can be replaced with <code><b>@end</b></code>.

This directive defines a code block that can take its own parameters. Macros are declared in a global scope. Macro parameters are only available within the macro scope and override global variables with the same name (but do not affect them). Macros can be used:

- via the <code><b>@include</b></code> directive:

	<pre>
	<b>@include</b> macro(a, b, c)
	</pre>

- inline:

	<pre>
	<b>@{</b>macro(a, b, c)<b>}</b>
	</pre>

When macros are used inline:

	- No line-control statements are generated for the output inside the macro scope.
	- Trailing newlines are trimmed from the macro output.

#### Examples ####

<pre>
<b>@macro</b> some_macro(a, b, c)
  Hello, <b>@{</b>a<b>}</b>!
  Roses are <b>@{</b>b<b>}</b>,
  And violets are <b>@{</b>defined(c) ? c : "of undefined color"<b>}</b>.
<b>@end</b>
</pre>

Then <code>some_macro</code> can be used as:

<pre>
<b>@include</b> some_macro("username", "red")
</pre>

This will produce:

```
Hello, username!
Roses are red,
And violets are of undefined color.
```

Here is the same macro used inline:

<pre>
[[[ <b>@{</b>some_macro("username", "red", "blue")<b>}</b> ]]]
</pre>

This will output:

```
[[[ Hello, username!
Roses are red,
And violets are blue. ]]]
```

### @include ###

Use this directive to includes local files, external sources, or macros.

<pre>
<b>@include</b> <i>&lt;source:expression&gt;</i>
</pre>

#### Macros ####

<pre>
<b>@include</b> some_macro("username", 123)
</pre>

#### Local Files ####

<pre>
<b>@include</b> "somefile.ext"
</pre>

#### Remote Files ####

<pre>
<b>@include</b> "http://example.com/file.ext"
</pre>

<pre>
<b>@include</b> "https://example.com/file.ext"
</pre>

#### Files From GitHub ####

<pre>
<b>@include</b> "github:<i>&lt;user&gt;</i>/<i>&lt;repo&gt;</i>/<i>&lt;path&gt;</i>[@<i>&lt;ref&gt;</i>]"
</pre>

- `user` is the user/organization name.
- `repo` is the repository name.
- `ref` is the git reference (branch name or tag, defaults to _master_).

##### Authentication #####

When using GitHub `@includes`, authentication is optional. However, you should bear in mind that:

- If you use authentication, the GitHub API provides much higher rate limits.
- Authentication is required to access private repositories.

Apart from a GitHub _username_, you need to provide either a _[personal access token](https://github.com/settings/tokens)_ **or** _password_ (which is less secure and not recommended). More information on how to provide those parameters is included in the [usage](#builder-usage) section.

##### Examples #####

- Head of the default branch

  <pre>
  <b>@include</b> "github:electricimp/Promise/promise.class.nut"
  </pre>

- Head of the _develop_ branch

  <pre>
  <b>@include</b> "github:electricimp/Promise/promise.class.nut@develop"
  </pre>

- Tag _v3.0.1_:

  <pre>
  <b>@include</b> "github:electricimp/Promise/promise.class.nut@v3.0.1"
  </pre>

#### Single Line Comments ####

Any text after any _Builder_ expression statement, starting with `//` and extending to the end of the line, will be ignored by _Builder_ and will not appear in the result output.

<pre>
<b>@include</b> "https://example.com/file.ext" // Need update to file2.ext
</pre>

### @include once ###

<pre>
<b>@include once</b> <i>&lt;source:expression&gt;</i>
</pre>

This acts the same as <code><b>@include</b></code> but has no effect if _source_ has already been included. Macros are always included.

<a id="inline-expressions-macros"></a>
### @{...} Inline Expressions/Macros ###

<pre>
<b>@{</b><i>&lt;expression&gt;</i><b>}</b>
</pre>

<pre>
<b>@{</b>macro(a, b, c)<b>}</b>
</pre>

This directive inserts the value of the enclosed expression or executes a macro.

#### Example ####

<pre>
<b>@set</b> name "Someone"
Hello, <b>@{</b>name<b>}</b>, the result is: <b>@{</b>123 * 456<b>}</b>.
</pre>

This results in the following output:

```
Hello, Someone, the result is: 56088.
```

### @while ###

This invokes a `while` loop. You can access the [loop](#loops) variable in `@while` loops.

<pre>
<b>@while</b> <i>&lt;test:expression&gt;</i>
  // 0-based iteration counter: <b>@{</b>loop.index<b>}</b>
  // 1-based iteration counter: <b>@{</b>loop.iteration<b>}</b>
<b>@endwhile</b>
</pre>

**Note** <code><b>@endwhile</b></code> can be replaced with <code><b>@end</b></code>.

#### Example ####

See [Loops](#loops).

### @repeat ###

This invokes a loop that repeats over a certain number of iterations. You can access the [loop](#loops) variable in `@repeat` loops.

<pre>
<b>@repeat</b> <i>&lt;times:expression&gt;</i>
  // 0-based iteration counter: <b>@{</b>loop.index<b>}</b>
  // 1-based iteration counter: <b>@{</b>loop.iteration<b>}</b>
<b>@endrepeat</b>
</pre>

**Note** <code><b>@endrepeat</b></code> can be replaced with <code><b>@end</b></code>.

#### Example ####

<pre>
<b>@repeat</b> 3
  loop.iteration: <b>@{</b>loop.iteration<b>}</b>
<b>@end</b>
</pre>

This outputs:

```
  loop.iteration: 1
  loop.iteration: 2
  loop.iteration: 3
```

<a id="if-elseeif-else"></a>
### @if... @elseif... @else ###

This directive invokes conditional branching.

<pre>
<b>@if</b> <test:expression>

  // Consequent code

<b>@elseif</b> <i>&lt;test:expression&gt;</i>

  // else if #1 code

// ...more elseifs...

<b>@else</b>

  // Alternative code

<b>@endif</b>
</pre>

**Note** <code><b>@endif</b></code> can be replaced with <code><b>@end</b></code>.

#### Example ####

<pre>
<b>@if</b> __FILE__ == 'abc.ext'
  // include something
<b>@elseif</b> __FILE__ == 'def.ext'
  // include something else
<b>@else</b>
  // something completely different
<b>@endif</b>
</pre>

### @error ###

<pre>
<b>@error</b> <i>&lt;message:expression&gt;</i>
</pre>

Emits an error.

#### Example ####

<pre>
<b>@if</b> PLATFORM == "platform1"
  // platform 1 code
<b>@elseif</b> PLATFORM == "platform2"
  // platform 2 code
<b>@elseif</b> PLATFORM == "platform3"
  // platform 3 code
<b>@else</b>
  <b>@error</b> "Platform is " + PLATFORM + " is unsupported"
<b>@endif</b>
</pre>

### @warning ###

<pre>
<b>@warning</b> <i>&lt;message:expression&gt;</i>
</pre>

Emits a warning.

#### Example ####

<pre>
<b>@if</b> PLATFORM == "platform1"
  // platform 1 code
<b>@elseif</b> PLATFORM == "platform2"
  // platform 2 code
<b>@elseif</b> PLATFORM == "platform3"
  // platform 3 code
<b>@else</b>
  <b>@warning</b> "Building for default platform"
  // default platform code
<b>@endif</b>
</pre>

## Filters ##

The `|` operator (filter) allows you to pass a value through any of the supported functions.

<pre>
<b>@{</b>&lt;expression&gt;</i> | <i>&lt;filter&gt;</i><b>}</b>
</pre>

This is equivalent to:

<pre>
<b>@{</b><i>&lt;filter&gt;(&lt;expression&gt;)</i><b>}</b>
</pre>

#### Example ####

<pre>
// Include external HTML to a string
a = "<b>@{</b>include('index.html')|escape<b>}</b>"

// Include external binary file to a base64-encoded string
b = "<b>@{</b>include('file.bin')|base64<b>}</b>"
</pre>

## Expressions ##

Directives that take parameters allow the usage of _expression_ syntax. For example:

- <code><b>@include</b> <i>&lt;source:expression&gt;</i></code>
- <code><b>@set</b> <i>&lt;variable:identifier&gt; &lt;value:expression&gt;</i></code>
- <code><b>@if</b> <i>&lt;condition:expression&gt;</i></code>
- <code><b>@elseif</b> <i>&lt;condition:expression&gt;</i></code>
- <code><b>@{</b><i>&lt;expression&gt;</i><b>}</b></code> (inline expressions)

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

`test ? consequent : alternate`

### Variables ###

Variables can be used in `Builder` expression evaluation. 

- Variables can be defined by:
    - The `-D <variable name> <variable value>` command line parameter.
    - A <code><b>@set</b></code> statement.
    - An [environment variable](#environment-variables).
- Undefined variables are evaluated as `null`.
- Variable names can contain `$`, `_`, latin letters and digits. They must not start with a digit.

#### Variable Definition Order ####

1. When resolving a variable’s value, *Builder* first looks for its definition in the command line `-D` parameters (`-D <variable name> <variable value>`) passed to the *pleasebuild* command. 
1. If no such variable definition is found, Squirrel code is scanned for `@set` statements preceding the variable usage. 
1. If no variable definitions are found in the previous steps, *Builder* looks in the host environment variables.

#### \_\_LINE\_\_ ####

Line number (relative to the file in which this variable appears).

#### Example ####

<pre>
Hi from line <b>@{</b>__LINE__<b>}</b>!
</pre>

#### \_\_FILE\_\_ ####

Name of the file in which this variable appears.

#### Example ####

<pre>
Hi from file <b>@{</b>__FILE__<b>}</b>!
</pre>

#### \_\_PATH\_\_ ####

Absolute path (not including file name) to the file where this variable appears. Can contain a URL for remote includes.

#### Example ####

<pre>
Hi from file <b>@{</b>__PATH__<b>}</b>!
</pre>

#### Loops ####

Defined inside <code><b>@while</b></code> and <code><b>@repeat</b></code> loops. Contains information about the current loop:

 - `loop.index` &mdash; 0-indexed iteration counter
 - `loop.iteration` &mdash; 1-indexed iteration counter

#### Example ####

<pre>
<b>@set</b> myvar = 12

<b>@while</b> myvar > 9
  <b>@set</b> myvar = myvar - 1
  var: <b>@{</b>myvar<b>}</b>
  loop.index: <b>@{</b>loop.index<b>}</b>
<b>@end</b>
</pre>

This outputs:

```
myvar: 11
loop.index: 0
myvar: 10
loop.index: 1
myvar: 9
loop.index: 2
```

#### Environment Variables ####

There is no special predicate required to make use of environment variables. *Builder* tries to resolve the macro from the context provided via the command line defines or from process environment variables. For example:

```squirrel
server.log("Host home path is @{HOME}");
```

will print the home directory path of the current user of the system where *Builder* was executed.

### Functions ###

- <code>defined(<i>&lt;variable_name&gt;</i>)</code> &mdash; returns `true` if a variable is defined, `false` otherwise.
- <code>include(<i>&lt;source&gt;</i>)</code> &mdash; includes external source.
- <code>escape(<i>&lt;value&gt;</i>)</code> &mdash; escapes special characters in string (`\b`, `\f`, `\n`, `\r`, `\t`,  `\`, `'`, `"`).
- <code>base64(<i>&lt;value&gt;</i>)</code> &mdash; encodes value as base64.
- <code>min(<i>&lt;numbers&gt;</i>)</code>
- <code>max(<i>&lt;numbers&gt;</i>)</code>
- <code>abs(<i>&lt;number&gt;</i>)</code>
- **String functions**<br />The following functions, based on the JavaScript methods of the same names, are available under the namespace `S`. The first argument of each function is always the string to be operated on. For documentation on the remaining arguments, please see [‘JavaScript String Methods’](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String).
    - <code>S.concat()</code>
    - <code>S.endsWith()</code>
    - <code>S.includes()</code>
    - <code>S.repeat()</code>
    - <code>S.split()</code>
    - <code>S.startsWith()</code>
    - <code>S.substr()</code>
    - <code>S.substring()</code>
    - <code>S.toLowerCase()</code>
    - <code>S.toUpperCase()</code>
    - <code>S.trim()</code>
    - <code>S.trimLeft()</code>
    - <code>S.trimRight()</code>

## Comments ##

Lines starting with `@` followed by space or a line break are treated as comments and not added to the output.

#### Example ####

<pre>
<i>@ something about platform #1</i>
<b>@set</b> PLATFORM "platform1"
</pre>

# Builder Usage #

## Running Builder ##

**Note** Builder requires Node.js 4.0 and above.

Builder can be installed and used by two ways - as an _npm_ command line tool or as an _npm_ library.

### As A Command Line Tool ###

Install Builder

```sh
npm install -g Builder
```

then use the `pleasebuild` command which is provided by Builder

```
pleasebuild [-l] [-D<variable> <value>]
    [--github-user <username> --github-token <token>]
    [--lib <path_to_file>] [--suppress-duplicate-includes-warning]
    [--cache] [--clear-cache] [--cache-exclude-list <path_to_file>]
    [--save-dependencies [<path_to_file>]] [--use-dependencies [<path_to_file>]]
    [--save-directives [<path_to_file>]] [--use-directives [<path_to_file>]]
    <input_file>
```

where:

`<input_file>` &mdash; is the path to source file which should be preprocessed

and the options are:

| Option | Synonym | Mandatory? | Value Required? | Description |
| --- | --- | --- | --- | --- |
| -l |  | No | No | Generates line control statements. For more detailed explanation please read [this](https://gcc.gnu.org/onlinedocs/gcc-4.5.4/cpp/Line-Control.html). |
| -D&lt;variable&gt; | | No | Yes | Defines a variable. See [Variables](#variables) section. May be specified several times to define different variables. |
| --github-user | | No | Yes | GitHub username. See [Files From GitHub](#files-from-github) section. |
| --github-token | | No | Yes | GitHub [personal access token](https://github.com/settings/tokens) or password (not recommended). Should be specified if `--github-user` option is specified. See [Files From GitHub](#files-from-github) section. |
| --lib | --libs | No | Yes | Includes the specified JavaScript file(s) as a library. See [Including JavaScript Libraries](#including-javascript-libraries) section. May be specified several times to include different libraries. The provided value may specify a concrete file or a directory (in this case all files from that directory are included). The value may contain [wildcards](https://www.npmjs.com/package/glob) (in this case all matched files are included). |
| --suppress-duplicate-includes-warning | --suppress-duplicate | No | No | Does not show a warning if a source file with the exact content was included multiple times from different places, that results in code duplication. |
| --cache | -c | No | No | Turns on cache for all files included from remote resources. See [Caching Remote Includes](#caching-remote-includes) section. This option is ignored if any of the options related to the [Reproducible Artifacts](#reproducible-artifacts) feature is specified. |
| --clear-cache | | No | No | Clears cache before Builder starts running. See [Caching Remote Includes](#caching-remote-includes) section. |
| --cache-exclude-list | | No | Yes | Path to the file that lists the resources which should be excluded from caching. See [Caching Remote Includes](#caching-remote-includes) section. |
| --save-dependencies | | No | No | Saves references to the used versions of GitHub files in the specified JSON file. See [Reproducible Artifacts](#reproducible-artifacts) section. If the file name is not specified, the `dependencies.json` file in the local directory is assumed. |
| --use-dependencies | | No | No | Reads from the specified JSON file references to the versions of GitHub files which should be used. See [Reproducible Artifacts](#reproducible-artifacts) section. If the file name is not specified, the `dependencies.json` file in the local directory is assumed. |
| --save-directives | | No | No | Saves Builder variable definitions in the specified JSON file. See [Reproducible Artifacts](#reproducible-artifacts) section. If the file name is not specified, `directives.json` file in the local directory is assumed.|
| --use-directives | | No | No | Reads from the specified JSON file Builder variable definitions which should be used. See [Reproducible Artifacts](#reproducible-artifacts) section. If the file name is not specified, `directives.json` file in the local directory is assumed. |

### As A Library ###

Install Builder 

  ```sh
  npm i --save Builder
  ```

then instantiate, setup and execute Builder from the source code, for example

```js
const Builder = require('Builder');
const builder = new Builder();

// Specify whether you need line control statements. See the "-l" CLI option
builder.machine.generateLineControlStatements = <true|false>;

// Cache all files included from remote sources. See the "--cache" CLI option
builder.machine.useCache = <true|false>;

// Set GitHub credentials. See the "--github-user" and "--github-token" CLI options
builder.machine.readers.github.username = "<USERNAME>";
builder.machine.readers.github.token = "<PASSWORD_OR_ACCESS_TOKEN>";

// Path to the file that lists the resources which should be excluded from caching.
// See the "--cache-exclude-list" CLI option
builder.machine.excludeList = "<PATH_TO_FILE>";

// Suppress warning about duplicate includes.
// See the "--suppress-duplicate-includes-warning" CLI option
builder.machine.suppressDupWarning = <true|false>;

// See the "--save-dependencies" CLI option
builder.machine.dependenciesSaveFile = <false|"PATH_TO_FILE">;
// See the "--use-dependencies" CLI option
builder.machine.dependenciesUseFile = <false|"PATH_TO_FILE">;

// See the "--save-directives" CLI option
builder.machine.directivesSaveFile = <false|"PATH_TO_FILE">;
// See the "--use-directives" CLI option
builder.machine.directivesUseFile = <false|"PATH_TO_FILE">;

const inputFile = "PATH_TO_YOUR_INPUT_FILE";

const result = builder.machine.execute(`@include "${inputFile}"`);
console.log(result);
```

To understand the details of Builder setup, review [this source code](./src/cli.js).

## Reproducible Artifacts ##

It is possible to save the build configuration used for preprocessing a source file &mdash; references to the concrete used versions of GitHub files/libraries and the used Builder variable definitions &mdash; and preprocess the source file again later with the early saved configuration. 

`--save-dependencies [<path_to_file>]` and `--use-dependencies [<path_to_file>]` options are used to save and to reuse, correspondingly, references to the concrete versions of GitHub files/libraries. The references are saved in a JSON file. If the file is not specified, `dependencies.json` file in the local directory is assumed. Every reference consists of GitHub file URL and Git Blob Id (Git Blob SHA). For more information see [here](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects) and [here](https://developer.github.com/v3/git/blobs/). **Note** It is possible to obtain Git Blob Id (Git Blob SHA) of a GitHub file using the following git command: `git hash-object <path_to_file>`

These options are processed the following way:
  - if the only `--save-dependencies [<path_to_file>]` is specified, the references to all source files uploaded from GitHub are saved in the provided JSON file.
  - if the only `--use-dependencies [<path_to_file>]` is specified, the source files from GithHub are uploaded using the references read from the provided JSON file.
  - if the both `--save-dependencies [<path_to_file>]` and `--use-dependencies [<path_to_file>]` are specified, then
    - first, the source files from GithHub are uploaded using the references read from the JSON file passed to the `--use-dependencies` option,
    - then, if the source code contains includes of files from GitHub which are not uploaded yet, they are uploaded.
    - Builder runs the prepocessing.
    - finally, references to all source files uploaded from GitHub are saved in the JSON file passed to the `--save-dependencies` option.

`--save-directives [<path_to_file>]` and `--use-directives [<path_to_file>]` options are used to save and to reuse, correspondingly, Builder variable definitions. The definitions are saved in a JSON file. If the file is not specified, the `directives.json` file in the local directory is assumed. These options are processed the similar way as the `--save-dependencies` and `--use-dependencies` options.
When `--use-directives [<path_to_file>]` option is used, the saved Builder variable definitions are merged with definitions specified by `-D<variable> <value>` options.

**Note** If any of the options to save/use dependendencies/directives is specified, the `--cache` option is ignored.

#### Examples Of Files ####

Example of a typical `dependencies.json` file: 
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

Example of a typical `directives.json` file:
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

Functions called by Builder will be called with their *this* argument set to a Builder context object. Within the context object, Builder [variables](#variables) like `__FILE__`, [functions](#functions) like `max()`, and other included library functions will be made available at the top level. Variables defined in your input code with `@macro` or `@set` will be available under the key *globals*.

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

# Testing #

```
SPEC_LOGLEVEL=<debug|info|warning|error> \
SPEC_GITHUB_USERNAME=<GitHub username> \
SPEC_GITHUB_TOKEN=<GitHub password/access token> \
npm test
```
All environment variables are optional here. Default for `SPEC_LOGLEVEL` is `error`.

# License #

Builder is licensed under the [MIT License](./LICENSE).
