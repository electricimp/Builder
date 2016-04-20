- [Syntax](#syntax)
  - [Directives](#directives)
    - [@set](#set)
    - [@macro](#macro)
    - [@include](#include)
      - [Macro](#macro)
      - [Local Files](#local-files)
      - [Remote Files](#remote-files)
      - [From Git Repository](#from-git-repository)
    - [@{...} (inline includes)](#-inline-includes)
    - [@if – elseif – @else](#if--elseif--else)
    - [@error](#error)
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
    - [Functions](#functions)
  - [Comments](#comments)
- [Usage](#usage)
- [License](#license)

<br /><img src=docs/logo.png?2 width=250 alt=Builder><br />

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
	- `__FILE__`, `__LINE__` and `__PATH__` variables are bound to the scope where  inline inclusion directive appears
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

#### From Git Repository

<pre>
<b>@include</b> "<i>&lt;repository_url&gt;</i>.git/<i>&lt;path&gt;</i>/<i>&lt;to&gt;</i>/<i>&lt;file&gt;</i>@<i>&lt;ref&gt;</i>"
</pre>

For example, importing file from _GitHub_ looks like:

- Head of the default branch

  <pre>
  <b>@include</b> "https://github.com/electricimp/Builder.git/README.md"
  </pre>

- Head of the _master_ branch

  <pre>
  <b>@include</b> "https://github.com/electricimp/Builder.git/README.md@master"
  </pre>

- Tag _v1.2.3_:

  <pre>
  <b>@include</b> "https://github.com/electricimp/Builder.git/README.md@v1.2.3"
  </pre>

- Latest available tag

  <pre>
  <b>@include</b> "https://github.com/electricimp/Builder.git/README.md@latest"
  </pre>

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

### Functions

- <code>min(<i>&lt;numbers&gt;</i>)</code>
- <code>max(<i>&lt;numbers&gt;</i>)</code>
- <code>abs(<i>&lt;number&gt;</i>)</code>
- <code>defined(<i>&lt;variable_name&gt;</i>)</code> – returns `true` if a variable is defined, `false` otherwise.

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
  const output = builder.machine.execute(`@include "${inputFile}"`);
  ```

- As CLI:

  _Bullder_ provides `pleasebuild` command when installed globally:

  ```sh
  npm i -g Builder
  pleasebuild <input_file> [-l (generate line control statements)]
  ```

# License

MIT

<br />

_**Author**_

_Mikhail Yurasov <mikhail@electricimp.com>_
