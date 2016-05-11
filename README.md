<img src=docs/logo.png?2 width=180 alt=Builder><br />

- [Syntax](#syntax)
  - [Directives](#directives)
    - [@set](#set)
    - [@macro](#macro)
    - [@include](#include)
      - [Macro](#macro)
      - [Local Files](#local-files)
      - [Remote Files](#remote-files)
      - [From GitHub](#from-github)
        - [Authentication](#authentication)
    - [@include once](#include-once)
    - [@{...} – inlines](#-inline-expressions-macros)
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
      - [\_\_LINE\_\_](#__line__)
      - [\_\_FILE\_\_](#__file__)
      - [\_\_PATH\_\_](#__path__)
      - [loop](#loop)
    - [Functions](#functions)
  - [Comments](#comments)
- [Usage](#usage)
- [Testing](#testing)
- [License](#license)

<br /> 
[![Build Status](https://travis-ci.org/electricimp/Builder.svg?branch=master)](https://travis-ci.org/electricimp/Builder)<br />

_Builder_ language combines a preprocessor with an expression language and advanced imports.


# Syntax

## Directives

Directives start with <code><b>@</b></code> symbol.

### @set

<pre>
<b><b>@set</b></b> <i>&lt;variable:identifier&gt;</i> <i>&lt;value:expression&gt;</i>
</pre>

<pre>
<b><b>@set</b></b> <i>&lt;variable:identifier&gt;</i> = <i>&lt;value:expression&gt;</i>
</pre>

Assigns a value of an _expression_ to a _variable_.

Variables are defined in a _global_ context.

Example:

_Sets `SOMEVAR` to 1:_

<pre>
<b>@set</b> SOMEVAR min(1, 2, 3)
</pre>

### @macro

<pre>
<b>@macro</b> <i>&lt;name&gt;</i>(<i>&lt;arguments&gt;</i>)
  <i>&lt;body&gt;</i>
<b>@endmacro</b>
</pre>

_<code><b>@endmacro</b></code> can be replaced with <code><b>@end</b></code>._

Defines a code region that can take it's own parameters. Macros are declared in a global scope. Macro parameters are only available within the macro scope and override global variables with the same name (but do not affect them).

Macros can be used:

- via <code><b>@include</b></code> directive:
	
	<pre>
	<b>@include</b> macro(a, b, c)
	</pre>
	
- inline:

	<pre>
	<b>@{</b>macro(a, b, c)<b>}</b>
	</pre>
	
	When macros are used inline:
	
	- no line control statements are generated for the output inside the macro scope
	- trailing newline is trimmed from macro output

Examples:

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

which will produce:

```
Hello, username!
Roses are red,
And violets are of undefined color.
```

The same macro used inline:

<pre>
[[[ <b>@{</b>some_macro("username", "red", "blue")<b>}</b> ]]]
</pre>

will ouput:

```
[[[ Hello, username!
Roses are red,
And violets are blue. ]]]
```

### @include

Includes local file, external source or a macro.

<pre>
<b>@include</b> <i>&lt;source:expression&gt;</i>
</pre>

#### Macro

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

Where:

- `user` – user/organization name
- `repo` – repository name
- `ref` – git reference (branch name or tag, defaults to _master_)


Examples:

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
  
When using GitHub includes, authentication is optional, however:

- with authentication GitHub API provides much higher rate limits
- to access private repositories authentication is required
 
Apart from GitHub _username_ you need to provide either a _[personal access token](https://github.com/settings/tokens)_ **or** _password_ (which is less secure and not recommended). More info on how to provide those parameters is in [usage](#usage) section.

### @include once

<pre>
<b>@include once</b> <i>&lt;source:expression&gt;</i>
</pre>

Acts the same as <code><b>@include</b></code> but has no effect if _source_ has already been included. 
Macros are always included.

### @{...} (inline expressions/macros)

<pre>
<b>@{</b><i>&lt;expression&gt;</i><b>}</b>
</pre>

<pre>
<b>@{</b>macro(a, b, c)<b>}</b>
</pre>

Inserts the value of the enclosed expression or executes a macro.

Example:

<pre>
<b>@set</b> name "Someone"
Hello, <b>@{</b>name<b>}</b>, the result is: <b>@{</b>123 * 456<b>}</b>.
</pre>

results in the following output:

```
Hello, Someone, the result is: 56088.
```

### @while

While-loop. [loop](#loop) variable is available in `@while` loops.

<pre>
<b>@while</b> <i>&lt;test:expression&gt;</i>
  // 0-based iteration counter: <b>@{</b>loop.index<b>}</b>
  // 1-based iteration counter: <b>@{</b>loop.iteration<b>}</b>
<b>@endwhile</b>
</pre>

_<code><b>@endwhile</b></code> can be replaced with <code><b>@end</b></code>._

[Example](#loop)

### @repeat

Loop that repeats a certain number of iterations. [loop](#loop) variable is available in `@repeat` loops.

<pre>
<b>@repeat</b> <i>&lt;times:expression&gt;</i>
  // 0-based iteration counter: <b>@{</b>loop.index<b>}</b>
  // 1-based iteration counter: <b>@{</b>loop.iteration<b>}</b>
<b>@endrepeat</b>
</pre>

_<code><b>@endrepeat</b></code> can be replaced with <code><b>@end</b></code>._

Example:

<pre>
<b>@repeat</b> 3 
  loop.iteration: <b>@{</b>loop.iteration<b>}</b>
<b>@end</b>
</pre>

outputs:

```
  loop.iteration: 1
  loop.iteration: 2
  loop.iteration: 3
```

### @if – @elseif – @else

Conditional directive.

<pre>
<b>@if</b> <test:expression>

  // consequent code

<b>@elseif</b> <i>&lt;test:expression&gt;</i>

  // else if #1 code

// ...more elseifs...

<b>@else</b>

  // alternate code

<b>@endif</b>
</pre>

_<code><b>@endif</b></code> can be replaced with <code><b>@end</b></code>._

Example:

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

Example:

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

"Filter" `|` operator allows to pass a value through any of supported functions.

<pre>
<b>@{</b>&lt;expression&gt;</i> | <i>&lt;filter&gt;</i><b>}</b>
</pre>

which is equivalent to:

<pre>
<b>@{</b><i>&lt;filter&gt;(&lt;expression&gt;)</i><b>}</b>
</pre>

Example:

<pre>
// include external HTML to a string
a = "<b>@{</b>include('index.html')|escape<b>}</b>"

// include external binary file to a base64-encoded string
b = "<b>@{</b>include('file.bin')|base64<b>}</b>"
</pre>

## Expressions

Directives that have parameters allow usage of _expression_ syntax.

For example:

- <code><b>@include</b> <i>&lt;source:expression&gt;</i></code>
- <code><b>@set</b> <i>&lt;variable:identifier&gt; &lt;value:expression&gt;</i></code>
- <code><b>@if</b> <i>&lt;condition:expression&gt;</i></code>
- <code><b>@elseif</b> <i>&lt;condition:expression&gt;</i></code>
- <code><b>@{</b><i>&lt;expression&gt;</i><b>}</b></code> (inline expressions)

### Types

The following types are supported in expressions:

- _numbers_ (eg: `1`,`1E6`, `1e-6`, `1.567`)
- _strings_ (eg: `"abc"`, `'abc'`)
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

- Variables defined by <code><b>@set</b></code> statements are available in expressions.
- Undefined variables are evaluated as `null`.
- Variable names can contain `$`, `_`, latin letters and digits and can start only with a non-digit.

#### \_\_LINE\_\_

Line number (relative to the file in which this variable appears).

Example:

<pre>
Hi from line <b>@{</b>__LINE__<b>}</b>!
</pre>

#### \_\_FILE\_\_

Name of the file in which this variable appears.

Example:

<pre>
Hi from file <b>@{</b>__FILE__<b>}</b>!
</pre>

#### \_\_PATH\_\_

Absolute path (not including file name) to the file where this variable appears.
Contains url for remote includes.

Example:

<pre>
Hi from file <b>@{</b>__PATH__<b>}</b>!
</pre>

#### loop

Defined inside <code><b>@while</b></code> and <code><b>@repeat</b></code> loops.
 
 Contains information about the current loop:
 
 - `loop.index` – 0-indexed iteration counter
 - `loop.iteration` – 1-indexed iteration counter

Example:

<pre>
<b>@set</b> myvar = 12

<b>@while</b> myvar > 9
  <b>@set</b> myvar = myvar - 1
  var: <b>@{</b>myvar<b>}</b>
  loop.index: <b>@{</b>loop.index<b>}</b>
<b>@end</b>
</pre>

outputs:

```
myvar: 11
loop.index: 0
myvar: 10
loop.index: 1
myvar: 9
loop.index: 2
```

### Functions

- <code>defined(<i>&lt;variable_name&gt;</i>)</code> – returns `true` if a variable is defined, `false` otherwise.
- <code>include(<i>&lt;source&gt;</i>)</code> – includes external source
- <code>escape(<i>&lt;value&gt;</i>)</code> – escapes special characters in string (`\b`, `\f`, `\n`, `\r`, `\t`,  `\`, `'`, `"`)
- <code>base64(<i>&lt;value&gt;</i>)</code> – encodes value as base64
- <code>min(<i>&lt;numbers&gt;</i>)</code>
- <code>max(<i>&lt;numbers&gt;</i>)</code>
- <code>abs(<i>&lt;number&gt;</i>)</code>

## Comments

Lines starting with `@` followed by space or a line break are treated as comments and not added to the output.

Example:

<pre>
<i>@ something about platform #1</i>
<b>@set</b> PLATFORM "platform1"
</pre>

# Usage

_Please note that Builder requires Node.js 4.0 and above._

- As _npm_ library:

  ```sh
  npm i --save Builder
  ```

  then

  ```js
  const builder = require('Builder');
  
  // provide GitHub credentials (optional)
  builder.machine.readers.github.username = "<usename>";
  builder.machine.readers.github.token = "<personal access token>";
  
  const output = builder.machine.execute(`@include "${inputFile}"`);
  ```

- As CLI:

  _Bullder_ provides `pleasebuild` command when installed globally:

  <pre>
  npm i -g Builder
  pleasebuild [-D<i>&lt;variable&gt;</i> <i>&lt;value&gt;</i>...] [-l] [--github-user <i>&lt;usename&gt;</i> --github-token <i>&lt;token&gt;</i>] [-l] <i>&lt;input_file&gt;</i>
  </pre>
  
  where:
  
  * `-l` – generate line control statements
  * <code>-D<i>&lt;variable&gt;</i> <i>&lt;value&gt;</i></code> – define a variable
  * <code>--github-user</code> – GitHub username
  * <code>--github-token</code> – GitHub [personal access token](https://github.com/settings/tokens) or password (not recommended)
    
# Testing

```
SPEC_LOGLEVEL=<debug|info|warning|error> \
SPEC_GITHUB_USERNAME=<GitHub username> \
SPEC_GITHUB_TOKEN=<GitHub password/access token> \
npm test
```

# License

MIT

<br />

_**Author**_

_Mikhail Yurasov <me@yurasov.me>_
