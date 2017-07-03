<img src=docs/logo.png?2 width=180 alt=Builder><br />

- [Syntax](#syntax)
  - [Directives](#directives)
    - [@set](#set)
    - [@macro](#macro)
    - [@include](#include)
      - [A Macro](#a-macro)
      - [Local Files](#local-files)
      - [Remote Files](#remote-files)
      - [From GitHub](#from-github)
    - [@include once](#include-once)
    - [@{...} – inlines](#-inline-expressionsmacros)
    - [@while](#while)
    - [@repeat](#repeat)
    - [@if – @elseif – @else](#if--elseif--else)
    - [@error](#error)
  - [Filters](#filters)
  - [Expressions](#expressions)
    - [Types](#types)
    - [Operators](#operators)
      - [Binary](#binary)
      - [Unary](#unary)
    - [Member Expressions](#member-expressions)
    - [Conditional Expressions](#conditional-expressions)
    - [Variables](#variables)
      - [Variables Definition](#variables-definition)
      - [\_\_LINE\_\_](#__line__)
      - [\_\_FILE\_\_](#__file__)
      - [\_\_PATH\_\_](#__path__)
      - [loop](#loop)
    - [Functions](#functions)
  - [Comments](#comments)
- [Usage](#usage)
- [Testing](#testing)
- [License](#license)

[![Build Status](https://travis-ci.org/electricimp/Builder.svg?branch=master)](https://travis-ci.org/electricimp/Builder)
<br/>

_Builder_ language combines a preprocessor with an expression language and advanced imports.

# Syntax

## Directives

Directives start with the <code><b>@</b></code> symbol.

### @set

<pre>
<b><b>@set</b></b> <i>&lt;variable:identifier&gt;</i> <i>&lt;value:expression&gt;</i>
</pre>

<pre>
<b><b>@set</b></b> <i>&lt;variable:identifier&gt;</i> = <i>&lt;value:expression&gt;</i>
</pre>

This directive assigns the value of an _expression_ to a _variable_. Variables are defined in a global context.

#### Example

Sets *SOMEVAR* to 1:

<pre>
<b>@set</b> SOMEVAR min(1, 2, 3)
</pre>

### @macro

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

#### Examples

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

This will ouput:

```
[[[ Hello, username!
Roses are red,
And violets are blue. ]]]
```

### @include

Use this directive to includes local files, external sources, or macros.

<pre>
<b>@include</b> <i>&lt;source:expression&gt;</i>
</pre>

#### A Macro

<pre>
<b>@include</b> some_macro("username", 123)
</pre>

#### Local Files

<pre>
<b>@include</b> "somefile.ext"
</pre>

#### Remote Files

<pre>
<b>@include</b> "http://example.com/file.ext"
</pre>

<pre>
<b>@include</b> "https://example.com/file.ext"
</pre>

#### From GitHub

<pre>
<b>@include</b> "github:<i>&lt;user&gt;</i>/<i>&lt;repo&gt;</i>/<i>&lt;path&gt;</i>[@<i>&lt;ref&gt;</i>]"
</pre>

- `user` is the user/organization name.
- `repo` is the repository name.
- `ref` is the git reference (branch name or tag, defaults to _master_).

#### Examples

- Head of the default branch

  <pre>
  <b>@include</b> "github:electricimp/Promise/Promise.class.nut"
  </pre>

- Head of the _develop_ branch

  <pre>
  <b>@include</b> "github:electricimp/Promise/Promise.class.nut@develop"
  </pre>

- Tag _v2.0.0_:

  <pre>
  <b>@include</b> "github:electricimp/Promise/Promise.class.nut@v2.0.0"
  </pre>

#### Authentication

When using GitHub `@includes`, authentication is optional. However, you should bear in mind that:

- If you use authentication, the GitHub API provides much higher rate limits.
- Authentication is required to access private repositories.

Apart from a GitHub _username_, you need to provide either a _[personal access token](https://github.com/settings/tokens)_ **or** _password_ (which is less secure and not recommended). More information on how to provide those parameters is included in the [usage](#usage) section.

### @include once

<pre>
<b>@include once</b> <i>&lt;source:expression&gt;</i>
</pre>

This acts the same as <code><b>@include</b></code> but has no effect if _source_ has already been included. Macros are always included.

<h3 id="-inline-expressionsmacros">@{...} (inline expressions/macros)</h3>

<pre>
<b>@{</b><i>&lt;expression&gt;</i><b>}</b>
</pre>

<pre>
<b>@{</b>macro(a, b, c)<b>}</b>
</pre>

This directive inserts the value of the enclosed expression or executes a macro.

#### Example

<pre>
<b>@set</b> name "Someone"
Hello, <b>@{</b>name<b>}</b>, the result is: <b>@{</b>123 * 456<b>}</b>.
</pre>

This results in the following output:

```
Hello, Someone, the result is: 56088.
```

### @while

This invokes a `while` loop. You can access the [loop](#loop) variable in `@while` loops.

<pre>
<b>@while</b> <i>&lt;test:expression&gt;</i>
  // 0-based iteration counter: <b>@{</b>loop.index<b>}</b>
  // 1-based iteration counter: <b>@{</b>loop.iteration<b>}</b>
<b>@endwhile</b>
</pre>

<code><b>@endwhile</b></code> can be replaced with <code><b>@end</b></code>.

[<h4>Example</h4>](#loop)

### @repeat

This invokes a loop that repeats over a certain number of iterations. You can access the [loop](#loop) variable in `@repeat` loops.

<pre>
<b>@repeat</b> <i>&lt;times:expression&gt;</i>
  // 0-based iteration counter: <b>@{</b>loop.index<b>}</b>
  // 1-based iteration counter: <b>@{</b>loop.iteration<b>}</b>
<b>@endrepeat</b>
</pre>

<code><b>@endrepeat</b></code> can be replaced with <code><b>@end</b></code>.

#### Example

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

### @if – @elseif – @else

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

<code><b>@endif</b></code> can be replaced with <code><b>@end</b></code>.

#### Example

<pre>
<b>@if</b> __FILE__ == 'abc.ext'
  // include something
<b>@elseif</b> __FILE__ == 'def.ext'
  // include something else
<b>@else</b>
  // something completely different
<b>@endif</b>
</pre>

### @error

<pre>
<b>@error</b> <i>&lt;message:expression&gt;</i>
</pre>

Emits an error.

#### Example

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

## Filters

The `|` operator (filter) allows you to pass a value through any of the supported functions.

<pre>
<b>@{</b>&lt;expression&gt;</i> | <i>&lt;filter&gt;</i><b>}</b>
</pre>

This is equivalent to:

<pre>
<b>@{</b><i>&lt;filter&gt;(&lt;expression&gt;)</i><b>}</b>
</pre>

#### Example

<pre>
// Include external HTML to a string
a = "<b>@{</b>include('index.html')|escape<b>}</b>"

// Include external binary file to a base64-encoded string
b = "<b>@{</b>include('file.bin')|base64<b>}</b>"
</pre>

## Expressions

Directives that take parameters allow the usage of _expression_ syntax. For example:

- <code><b>@include</b> <i>&lt;source:expression&gt;</i></code>
- <code><b>@set</b> <i>&lt;variable:identifier&gt; &lt;value:expression&gt;</i></code>
- <code><b>@if</b> <i>&lt;condition:expression&gt;</i></code>
- <code><b>@elseif</b> <i>&lt;condition:expression&gt;</i></code>
- <code><b>@{</b><i>&lt;expression&gt;</i><b>}</b></code> (inline expressions)

### Types

The following types are supported in expressions:

- _numbers_ (eg. `1`, `1E6`, `1e-6`, `1.567`)
- _strings_ (eg. `"abc"`, `'abc'`)
- `null`
- `true`
- `false`

### Operators

#### Binary

`|| && == != < > <= >= + - * / %`

#### Unary

`+ - !`

### Member Expressions

- `somevar.member`
- `somevar["member"]`
- `([1, 2, 3])[1]`

### Conditional Expressions

`test ? consequent : alternate`

### Variables

Variables can be used in `Builder` expressions evaluation. 

- Variable can be defined by `-D<variable name> <variable value>` command line parameter, read from [runtime environment](#environment-variables), or defined by <code><b>@set</b></code> statements.
- Undefined variables are evaluated as `null`.
- Variable names can contain `$`, `_`, latin letters and digits. They must not start with a digit.

#### Variables Definition

1. When resolving a variable value, *Builder* first looks for its 
definition in command line `-D` parameters (`-D<variable name> <variable value>`) 
passed to the `pleasebuild` command. 
1. Then, if no such variable definition is found among the `-D` 
parameters then Squirrel code is scanned for `@set` statements 
preceding the variable usage. 
1. And finally, if no such variable definition is found on the previous steps, 
`Builder` looks for it in the host environment variables.

#### \_\_LINE\_\_

Line number (relative to the file in which this variable appears).

**Example**

<pre>
Hi from line <b>@{</b>__LINE__<b>}</b>!
</pre>

#### \_\_FILE\_\_

Name of the file in which this variable appears.

**Example**

<pre>
Hi from file <b>@{</b>__FILE__<b>}</b>!
</pre>

#### \_\_PATH\_\_

Absolute path (not including file name) to the file where this variable appears. Can contain a URL for remote includes.

**Example**

<pre>
Hi from file <b>@{</b>__PATH__<b>}</b>!
</pre>

#### loop

Defined inside <code><b>@while</b></code> and <code><b>@repeat</b></code> loops. Contains information about the current loop:

 - `loop.index` &mdash; 0-indexed iteration counter
 - `loop.iteration` &mdash; 1-indexed iteration counter

**Example**

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

#### Environment variables

There is no special predicate to use environment variables. **Builder** tries to resolve macro from context provided by command line defines or from process environment variables.

```
server.log("Host home path is @{HOME}");
```

This will print home folder of current logged user at the system where **Builder** was executed.

### Functions

- <code>defined(<i>&lt;variable_name&gt;</i>)</code> &mdash; returns `true` if a variable is defined, `false` otherwise.
- <code>include(<i>&lt;source&gt;</i>)</code> &mdash; includes external source.
- <code>escape(<i>&lt;value&gt;</i>)</code> &mdash; escapes special characters in string (`\b`, `\f`, `\n`, `\r`, `\t`,  `\`, `'`, `"`).
- <code>base64(<i>&lt;value&gt;</i>)</code> &mdash; encodes value as base64.
- <code>min(<i>&lt;numbers&gt;</i>)</code>
- <code>max(<i>&lt;numbers&gt;</i>)</code>
- <code>abs(<i>&lt;number&gt;</i>)</code>

## Comments

Lines starting with `@` followed by space or a line break are treated as comments and not added to the output.

#### Example

<pre>
<i>@ something about platform #1</i>
<b>@set</b> PLATFORM "platform1"
</pre>

# Usage

## FileCache
 Builder provides cache of remote files. Builder can download your remote files at the local storage (`.builder-cache` by default) and use it, everytime you want to include file. 
 
**Note** Builder automatically invalidate cached files older than 24 hours.

Option `-c` or `--cache-all` allows you to cache all remote files, that will be included. In `.exclude-list.builder` file can be specified filenames or masks, that will never be cached.

#### Example
```sh
# .exclude-list.builder
# exclude direct file that will be excluded
github:electricimp/Builder/spec/fixtures/sample-11/LineBrakeSample.nut
# exclude all electricimp repos 
github:electicimp/**
# exclude all not tagget files from github
!github:**/*@*
```

Option `--cache-exclude-list=<path_to_file>` allows to define exclude list file and folder.

Option `--invalidate-cache` will delete all cache files before Builder starts running. With `-c` option it will completelly update cache. 

## Running
**Note** Builder requires Node.js 4.0 and above.

- As an _npm_ library:

  ```sh
  npm i --save Builder
  ```

  then

  ```js
  const builder = require('Builder');

  // Provide GitHub credentials (optional)
  builder.machine.readers.github.username = "<usename>";
  builder.machine.readers.github.token = "<personal access token>";
  
  // Set up cache params (optional)
  builder.machine.useCache = "<boolean>";
  builder.machine.excludeList = "<path to exclude file>" // or "" for default name
  builder.machine.clearCache() // delete 
  const output = builder.machine.execute(`@include "${inputFile}"`);
  ```

- As a CLI:

  _Bullder_ provides the `pleasebuild` command when installed globally. For example:

  <pre>
  npm i -g Builder
  pleasebuild [-D<i>&lt;variable&gt;</i> <i>&lt;value&gt;</i>...] [--github-user <i>&lt;usename&gt;</i> --github-token <i>&lt;token&gt;</i>] [-l] [--cache-all] [--invalidate-cache] [--cache-exclude-list=<i>&lt;path_to_file&gt;</i>] <i>&lt;input_file&gt;</i> 
  </pre>

  where:

  * <code> `-l` </code> &mdash; generate line control statements.
  * <code>-D<i>&lt;variable&gt;</i> <i>&lt;value&gt;</i></code> &mdash; define a variable.
  * <code>--github-user</code> &mdash; GitHub username.
  * <code>--github-token</code> &mdash; GitHub [personal access token](https://github.com/settings/tokens) or password (not recommended).
  * <code>--cache-all</code> or <code>-c</code> &mdash; cache all files.
  * <code>--invalidate-cache</code> &mdash; remove cache before builder starts running.
  * <code>--cache-exclude-list=<i>&lt;path_to_file&gt;</i></code> &mdash; path to exclude list file with filename.
  
# Testing

```
SPEC_LOGLEVEL=<debug|info|warning|error> \
SPEC_GITHUB_USERNAME=<GitHub username> \
SPEC_GITHUB_TOKEN=<GitHub password/access token> \
npm test
```

# License

Builder is licensed under the [MIT License](./LICENSE).
