<img src=docs/logo.png?2 width=180 alt=Builder><br />

### Current version: 3.0.0 ###

![Build Status](https://cse-ci.electricimp.com/app/rest/builds/buildType:(id:Builder_BuildAndTest)/statusIcon)

## Contents ##

- [About Builder](#about-builder)
- [Builder Installation](#builder-installation)
    - [Command Line Tool Installation](#command-line-tool-installation)
    - [Library Installation](#library-installation)
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
            - [Define A Macro](#define-a-macro)
            - [Use A Macro](#use-a-macro)
        - [@include](#include)
            - [GitHub Authentication](#github-authentication)
        - [@include once](#include-once)
        - [@while](#while)
        - [@repeat](#repeat)
        - [@if... @elseif... @else](#if-elif-else)
        - [@error](#error)
        - [@warning](#warning)
    - [Filters](#filters)
- [Advanced Builder Usage](#advanced-builder-usage)
    - [Reproducible Artifacts](#reproducible-artifacts)
        - [Builder Variables: Directives](#builder-variables-directives)
        - [GitHub Files: Dependencies](#github-files-dependencies)
    - [Including JavaScript Libraries](#including-javascript-libraries)
        - [Binding The Context Object Correctly](#binding-the-context-object-correctly)
    - [Managing Remote Includes](#managing-remote-includes)
        - [Caching Remote Includes](#caching-remote-includes)
        - [Proxy Access To Remote Includes](#proxy-access-to-remote-includes)
        - [Local Includes From Remote Files](#local-includes-from-remote-files)
- [Testing](#testing)
- [License](#license)

# About Builder #

Builder combines a preprocessor with an expression language and advanced imports.

There are a number of ways in which you can [install Builder](#builder-installation) depending on how you plan to integrate it into your workflow. Once installed on your computer, you can use it to process your Squirrel application and factory firmware before you transfer the code to an impCentral™ Device Group.

**Note** The [Electric Imp VS Code extension](https://github.com/electricimp/vscode) already incorporates Builder and can be used to upload code to Device Groups. If you are using the VS Code extension, there is no need install Builder separately to take advantage of its features.

You can use Builder to pull the contents of separate code files into your main source code files. These additional files might contain library code that you make use of across a number of different products, or they might contain confidential data which you don’t want to keep inside source code files that are managed through a software version control system.

You tell Builder which files to import, and where within your main source code they should be inserted, by using the [`@include`](#include) command. Builder is able to access additional files that are stored on your computer or held remotely on a local network file share, on an Internet site or hosted by GitHub.

While Builder can be used to insert code this way, it can be used in far more sophisticated ways thanks to its integrated expression processor and programming logic. For example, if you need to generate multiple versions of your application firmware for versions of your product which make use of different imp modules, you can use Builder’s [conditional execution features](#if-elif-else), [variables](#variables) and [loops](#while) to pull your various code components together at build time and output files that are ready to be transferred to impCentral.

To speed up the process, [files that are stored remotely](#managing-remote-includes) which are not expected to change between builds can be cached for quick re-use. Builder's [reproducible artifacts](#reproducible-artifacts) feature makes it possible to store references to all files and variables, so that builds can be re-created for future debugging.

For details on the commands that Builder offers, please see the [Directives](#directives) section. This is part of the [Builder Syntax](#builder-syntax) section, which also describes how Builder commands are structured.

# Builder Installation #

Builder requires Node.js 8.0.0 and above. It can be installed and used by two ways:

- As an [_npm_ command line tool](#command-line-tool-installation)
- As an [_npm_ library](#library-installation).

## Command Line Tool Installation ##

Install Builder:

```sh
npm install -g Builder
```

Now use Builder’s `pleasebuild` command to configure the newly installed utility:

```sh
pleasebuild [-l] [-D<variable> <value>]
    [--github-user <username> --github-token <token>]
    [--lib <path_to_file>]
    [--use-remote-relative-includes] [--suppress-duplicate-includes-warning]
    [--cache] [--clear-cache] [--cache-exclude-list <path_to_file>]
    [--save-dependencies [<path_to_file>]] [--use-dependencies [<path_to_file>]]
    [--save-directives [<path_to_file>]] [--use-directives [<path_to_file>]]
    <input_file>
```

where `<input_file>` is the path to source file which should be preprocessed and the other options are:

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

## Library Installation ##

Install Builder:

```sh
npm i --save Builder
```

Now instantiate, configure and execute Builder from within your source code. For example:

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

To understand Builder configuration, please review [this source code](./src/cli.js).

# Builder Syntax #

## Expressions ##

### Types ###

The following value types are supported in expressions:

- *numbers* (eg. `1`, `1E6`, `1e-6`, `1.567`)
- *strings* (eg. `"abc"`, `'abc'`)
- *booleans* (eg. `true`, `false`)
- `null`

### Operators ###

Builder supports the following operators:

#### Binary ####

`||`&nbsp;&nbsp;`&&`&nbsp;&nbsp;`==`&nbsp;&nbsp;`!=`&nbsp;&nbsp;`<`&nbsp;&nbsp;`>`&nbsp;&nbsp;`<=`&nbsp;&nbsp;`>=`&nbsp;&nbsp;`+`&nbsp;&nbsp;`-`&nbsp;&nbsp;`*`&nbsp;&nbsp;`/`&nbsp;&nbsp;`%`

#### Unary ####

`+`&nbsp;&nbsp;`-`&nbsp;&nbsp;`!`

### Member Expressions ###

Membership of an object is expressed using any of the following expressions:

- `somevar.member`
- `somevar["member"]`
- `([1, 2, 3])[1]`

### Conditional Expressions ###

Builder provides the standard ternary operator (`?:`) for evaluating basic conditions:

`<condition> ? <if_condition_true> : <if_condition_false>`

### Variables ###

Variables can be used in Builder expressions. Variable names can contain `$`, `_`, latin letters and digits, however they must not start with a digit. Variables can be defined in the following ways:

- Builder's [`@set`](#set) directive.
- Your computer's [environment variables](#environment-variables).
- Pass the option `-D<variable name> <variable value>` to Builder’s [`pleasebuild`](#command-line-tool-installation) command.

All undefined variables are evaluated as `null`.

#### Variable Definition Order ####

When resolving a variable’s value:

1. Builder looks for its definition among the command line parameters (as `-D<variable name> <variable value>`) passed to the [`pleasebuild`](#command-line-tool-installation) command.
2. If no such variable definition is found, the code is scanned for [`@set`](#set) directive statements preceding the variable usage.
3. If no variable definitions are found in the previous steps, Builder looks in the host environment variables.

#### Environment Variables ####

There is no special predicate required to make use of environment variables. Builder looks in the host environment variables to try and resolve the expressions if no command line or local variables have been set.

For example, on a Mac:

```squirrel
server.log("Host home path is @{HOME}");
```

will print the home directory path of the current user of the system where Builder was executed.

Environment variables differ based on OS. If you wish to use environment variables with Builder, a quick internet search will give you details on how to *list* the variables currently available on your system and also how to *set* new variables.

#### Builder Variables ####

Builder provides the following pre-defined variables:

- `__LINE__` &mdash; The line number (relative to the file in which this variable appears). For example:

    `Hi from line @{__LINE__}!`
- `__FILE__` &mdash; The name of the file in which this variable appears. For example:

    `Hi from file @{__FILE__}!`
- `__PATH__` &mdash; The absolute path (not including file name) to the file where this variable appears. Can contain a URL for remote includes. For example:

    `Hi from file @{__PATH__}!`

<a id="loopvars"></a>

Builder has two directives [`@while`](#while) and [`@repeat`](#repeat) for managing loops. Inside these loops the following variables are available:

- `loop.index` &mdash; 0-indexed iteration counter
- `loop.iteration` &mdash; 1-indexed iteration counter

Usage examples for these variables can be found in the [`@while`](#while) and [`@repeat`](#repeat) directive examples.

### Builder Functions ###

Builder provides the following helper functions:

- `defined(<variable_name>)` &mdash; returns `true` if a variable is defined, `false` otherwise.
- `include(<source>)` &mdash; includes external source.
- `escape(<value>)` &mdash; escapes special characters in string (`\b`, `\f`, `\n`, `\r`, `\t`,  `\`, `'`, `"`).
- `base64(<value>)` &mdash; encodes value as base64.
- `min(<numbers>)` &mdash; returns a number equal to the lowest number in the supplied list.
- `max(<numbers>)` &mdash; returns a number equal to the highest number in the supplied list.
- `abs(<number>)` &mdash; returns the absolute value of the supplied number.

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

Lines starting with `@` followed by space or a line break are treated as comments and not added to the output. For example:

```
@ This is a Builder comment and will not appear in the output
```

Any text following `//` and extending to the end of the line will be ignored by Builder* and will not appear in the result output. For example:

```
@set SOME_STRING = "my string" // This is a Builder comment that will not appear in output
```

## Directives ##

All of Builder’s directives start with the `@` symbol. Don’t include a space or line break between the `@` and the required directive’s name as this will be interpreted as a [comment](#comments).

### @{...} Inline Expressions/Macros ###

This directive evaluates the expression enclosed by braces (`{` and  `}`) and inserts the result into the output. The enclosure can be the value of a named variable, an expression or a macro.

<pre>
<b>@{</b><i>&lt;variable:identifier&gt;</i><b>}</b>
<b>@{</b><i>&lt;expression&gt;</i><b>}</b>
<b>@{</b><i>macro(a, b, c)</i><b>}</b>
</pre>

#### Example ####

The line:

```
The result is: @{123 * 456}.
```

results in the following output:

```
The result is: 56088.
```

### @set ###

This directive assigns a value or the value of an expression to a [variable](#variables). Variables are defined in a global context. A value can be any supported [type](#types) or [function](#builder-functions).

<pre>
<b>@set </b><i>&lt;variable:identifier&gt; &lt;value:expression&gt;</i>
<b>@set </b><i>&lt;variable:identifier&gt;</i> <b>=</b> <i>&lt;value:expression&gt;</i>
</pre>

#### Example ####

In this example, we define a number of variables using `@set`, then use [`@{...}`](#-inline-expressionsmacros) to create squirrel log messages with those variables. If the following lines are added to your source code:

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

then during processing, Builder will output:

```
// Use Builder global variables in squirrel log messages
server.log(10);
server.log("my string");
server.log(true);
server.log(1);
```

### @macro ###

This directive defines a code block with its own parameters. Macros are declared in a global scope. Macro parameters are only available within the macro scope and override global variables with the same name (but do not affect them).

#### Define A Macro ####

<pre>
<b>@macro</b> <i>&lt;name&gt;</i>(<i>&lt;arguments&gt;</i>)
    <i>&lt;body&gt;</i>
<b>@endmacro</b>
</pre>

**Note** `@end` can be used in place of `@endmacro` if you prefer.

#### Use A Macro ####

Macros can be used either inline with the [`@{...}`](#-inline-expressionsmacros) directive, or with the [`@include`](#include) directive. When macros are used inline no line-control statements are generated for the output inside the macro scope and trailing newlines are trimmed from the macro output.

<pre>
<b>@{</b>macro<b>(</b>a, b ,c)<b>}</b>
<b>@include</b> macro(a, b ,c)
</pre>

#### Inline Example ####

Define a macro and use the [`@{...}`](#-inline-expressionsmacros) directive to create a multi-line string to log in squirrel:

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

Define a macro and use it with [`@include`](#include) to create a multi-line string to log in squirrel:

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

Use a [function](#builder-functions) to configure and use a macro with an optional parameter.

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

This directive can be used to include local files, external sources or [macros](#macro).

<pre>
<b>@include</b> <i>&lt;source:expression&gt;</i>
</pre>

- For a [`@macro`](#macro):

    <pre><b>@include</b> some_macro("username", 123)</pre>

- For a local file:

    <pre><b>@include</b> "somefile.ext"</pre>

- For a remote file:

    <pre><b>@include</b> "https://example.com/file.ext"</pre>

    For more detailed information on making use of remote includes, please see [Managing Remote Includes](#managing-remote-includes).

- For GitHub file, where:

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

The `@include` directive can be combined with the `__PATH__` [variable](#builder-variables) to build references to your files.

```
// Include supporting source files
@include __PATH__ + "Hardware.device.nut"
@include __PATH__ + "/../shared/Logger.shared.nut"
@include __PATH__ + "/../shared/Constants.shared.nut"
```

#### GitHub Authentication ####

When using GitHub `@include` statements, authentication is optional. However, you should bear in mind that:

- If you use authentication, the GitHub API provides much higher rate limits.
- Authentication is required to access private repositories.

Apart from a GitHub username, you need to provide either a [personal access token](https://github.com/settings/tokens) **or** a password (which is less secure and not recommended). If you are using Builder as a [library](#library-installation), GitHub credentials can be stored using your system's environment variables or in files that store Builder variables. When you are using Builder's [command line tool](#command-line-tool-installation), your GitHub credentials will need to be passed into the `pleasebuild` command.

### @include once ###

This directive acts just like `@include` but has no effect if the specified *source* has already been included. However, macros are always included.

<pre><b>@include once</b> <i>&lt;source:expression&gt;</i></pre>

### @while ###

This directive invokes a loop which only ends when specified conditions are met. You can access Builder’s [loop variables](#loopvars) within `@while` loops.

<pre>
<b>@while</b> <i>&lt;test:expression&gt;</i>
    // 0-based iteration counter: <b>@{</b>loop.index<b>}</b>
    // 1-based iteration counter: <b>@{</b>loop.iteration<b>}</b>
<b>@endwhile</b>
</pre>

**Note** `@end` may be used in place of `@endwhile` if you prefer.

#### Example ####

The following lines, when added to your source code:

```
@set myvar = 12

@while myvar > 9
    @set myvar = myvar - 1
var: @{myvar}
    loop.index: @{loop.index}
    loop.iteration: @{loop.iteration}
@end
```

will output:

```
var: 11
    loop.index: 0
    loop.iteration: 1
var: 10
    loop.index: 1
    loop.iteration: 2
var: 9
    loop.index: 2
    loop.iteration: 3
```

### @repeat ###

This directive invokes a loop that repeats for a certain number of iterations. You can access Builder’s [loop variables](#loopvars) within `@repeat` loops.

<pre>
<b>@repeat</b> <i>&lt;times:expression&gt;</i>
    // 0-based iteration counter: <b>@{</b>loop.index<b>}</b>
    // 1-based iteration counter: <b>@{</b>loop.iteration<b>}</b>
<b>@endrepeat</b>
</pre>

**Note** `@end` may be used in place of `@endrepeat` if you prefer.

#### Example ####

The following lines, when added to your source code:

```
@repeat 3
    loop.index: @{loop.index}
    loop.iteration: @{loop.iteration}

@end
```

will output:

```
    loop.index: 0
    loop.iteration: 1

    loop.index: 1
    loop.iteration: 2

    loop.index: 2
    loop.iteration: 3

```

<a id="if-elif-else"></a>

### @if... @elseif... @else ###

This directive provides conditional branching.

<pre>
<b>@if</b> <i>&lt;test:expression&gt;</i>
    // Consequent code
<b>@elseif</b> <i>&lt;test:expression&gt;</i>
    // else if #1 code
<b>@else</b>
    // Alternative code
<b>@endif</b>
</pre>

**Note** `@end` may be used in place of `@endif` if you prefer.

#### Example ####

```
@if __FILE__ == 'abc.ext'
    // include something
@elseif __FILE__ == 'def.ext'
    // include something else
@else
    // do something completely different
@endif
```

### @error ###

This directive simply emits an error.

<pre>
<b>@error</b> <i>&lt;message:expression&gt;</i>
</pre>

#### Example ####

```
@if PLATFORM == "platform1"
    // platform 1 code
@elseif PLATFORM == "platform2"
    // platform 2 code
@elseif PLATFORM == "platform3"
    // platform 3 code
@else
    @error "Platform " + PLATFORM + " is unsupported"
@endif
```

### @warning ###

This directive simply emits a warning.

<pre>
<b>@warning</b> <i>&lt;message:expression&gt;</i>
</pre>

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

The filter operator, `|`, allows you to pass a value through any of the supported [functions](#builder-functions).

<pre>
<b>@{</b>&lt;expression&gt;</i> | <i>&lt;filter&gt;</i><b>}</b>
</pre>

This is equivalent to:

<pre>
<b>@{</b><i>&lt;filter&gt;(&lt;expression&gt;)</i><b>}</b>
</pre>

#### Example ####

```
// Include external HTML piped through the escape processing function
a = "@{include('index.html')|escape}"

// Include an external binary piped through the base64 encoder function
b = "@{include('file.bin')|base64}"
```

# Advanced Builder Usage #

This section contains information that will help you work with Builder more effectively, but may not be needed for more basic Builder tasks. These advanced options include:

- [Reproducible Artifacts](#reproducible-artifacts)
- [Including JavaScript Libraries](#including-javascript-libraries)
- [Managing Remote Includes](#managing-remote-includes)

## Reproducible Artifacts ##

It is possible to save the build configuration data used for preprocessing a source file in order to create an identical source file again later with that saved configuration. Builder variable definitions are saved in a [‘directives.json’](#builder-variables-directives) file, and references to the concrete versions of GitHub files and libraries are stored in a [‘dependencies.json’](#github-files-dependencies) file.

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

## Including JavaScript Libraries ##

Builder can accept JavaScript libraries to add functionality to its global namespace. The library should export an object, the properties of which will be merged into the global namespace. For example, to include a function, *upper()*, to convert strings to uppercase, define your library file like so:

```js
module.exports = {
    upper: (s) => s.toUpperCase()
};
```

Now include the function within directives in your input file:

```
@{upper("warning:")}
@{upper(include("warning.txt"))}
```

Finally, run Builder with the option `--lib path/to/your/lib/file`.

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

## Managing Remote Includes ##

There are a number of advanced techniques you may apply when including remote files in your source code using Builder.

### Caching Remote Includes ###

To reduce compilation time, Builder can optionally cache files included from a remote resource (ie. GitHub or remote HTTP/HTTPs servers). If this file cache is enabled, remote files are cached locally in the *.builder-cache* directory. Cached resources expire and are automatically invalidated 24 hours after their addition to the cache.

To turn the cache on, pass the `--cache` or `-c` option to Builder. If this option is not specified, Builder will not use the file cache even if the cached data exists and is valid &mdash; it will continue to query remote resources on every execution.

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

When running tests locally, please test on both Windows and macOS. All environment variables are optional. However, if you are working with `@includes` from GitHub and do not provide GitHub credentials, rate limits imposed by GitHub may cause test failures. The default for `SPEC_LOGLEVEL` is `error`. The example below is written for mac terminal.

```sh
npm install
export SPEC_LOGLEVEL=<debug|info|warning|error>
export SPEC_GITHUB_USERNAME=<GitHub username>
export SPEC_GITHUB_TOKEN=<GitHub password/access token>
npm test
```

# License #

Builder is licensed under the [MIT License](./LICENSE).
