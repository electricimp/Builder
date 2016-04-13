
- [Syntax](#syntax)
  - [Directives](#directives)
    - [@set](#set)
    - [@macro](#macro)
    - [@if – elseif – @else](#if--elseif--else)
    - [@{...} (inline expressions)](#-inline-expressions)
    - [@error](#error)
    - [@include](#include)
      - [Macro](#macro)
      - [Local Files](#local-files)
      - [Remote Files](#remote-files)
      - [From Git Repository](#from-git-repository)
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
- [License](#license)


<br /><img src=docs/logo.png?1 width=280 alt=Builder><br /><br />

_Builder_ language combines a preprocessor with an expression language and advanced imports.

_Please note that the works is in-progress and published for preview purposes only._

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

Declares a block of code that can take parameters and can be used with an <code><b>@include</b></code> statement. Once declared, macros are available from anywhere.

Variables declared as macro argumentys are only available within the macro scope and override global variables with the same name (but do not change them).

Example:

<pre>
<b>@macro</b> some_macro(a, b, c)
  Hello, <b>@{</b>a<b>}</b>!
  Roses are <b>@{</b>b<b>}</b>,
  And violets are <b>@{</b>defined(c) ? c : "of undefiend color"<b>}</b>.
<b>@end</b>
</pre>

Then <code>some_macro</code> can be used as:

<pre>
<b>@include</b> some_macro("username", 123)
</pre>

which will produce:

```
Hello, username!
Roses are red,
And violets are of undefiend color.
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

### @{...} (inline expressions)

<pre>
<b>@{</b><i>&lt;expression&gt;</i><b>}</b>
</pre>

Inserts the value of the enclosed expression.

Example:

<pre>
<b>@set</b> name "Someone"
Hello, <b>@{</b>name<b>}</b>, the result is: <b>@{</b>123 * 456<b>}</b>.
</pre>

results in the following output:

```
Hello, Someone, the result is: 56088.
```

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
  <b>@include</b> "https://github.com/electricimp/Builder.git/README.md<@master"
  </pre>

- Tag _v1.2.3_:

  <pre>
  <b>@include</b> "https://github.com/electricimp/Builder.git/README.md@v1.2.3"
  </pre>

- Latest available tag

  <pre>
  <b>@include</b> "https://github.com/electricimp/Builder.git/README.md@latest"
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

- Variables defined by `<b>@set</b>` statements are available in expressions.
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

# License

MIT

# Author

Mikhail Yurasov <mikhail@electricimp.com>
