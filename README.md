<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Syntax](#syntax)
  - [Directives](#directives)
    - [&#64;set](#&64set)
    - [@macro](#@macro)
    - [@if – <b>@elseif</b> – <b>@else</b>](#@if-%E2%80%93-b@elseifb-%E2%80%93-b@elseb)
    - [@{...} (inline expressions)](#@-inline-expressions)
    - [@error](#@error)
    - [@include](#@include)
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
      - [\_\_LINE\_\_](#%5C_%5C_line%5C_%5C_)
      - [\_\_FILE\_\_](#%5C_%5C_file%5C_%5C_)
    - [Functions](#functions)
  - [Comments](#comments)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<br /><img src=docs/logo.png?1 width=280 alt=Builder><br /><br />

_Builder_ language combines a preprocessor with an expression language and advanced imports.

_Please note that the works is in-progress and published for preview purposes only._

# Syntax


## Directives

Directives start with `@` symbol.

### &#64;set

<pre>
<b><b>@set</b></b> <i>&lt;variable:identifier&gt;</i> <i>&lt;value:expression&gt;</i>
</pre>

<pre>
<b><b>@set</b></b> <i>&lt;variable:identifier&gt;</i> = <i>&lt;value:expression&gt;</i>
</pre>

Assigns a value of an _expression_ to a _variable_.

Variables are defined in a _global_ context.

Example:

_Sets SOMEVAR to 1:_

<pre>
<b>@set</b> SOMEVAR min(1, 2, 3)
</pre>

### @macro

```
<b>@macro</b> <name>(<arguments>)
  <body>
<b>@endmacro</b>
```

_`<b>@endmacro</b>` can be replaced with `<b>@end</b>`._

Declares a block of code that can take parameters and can be reused with an `<b>@include</b>` statement. Once declared macros

Variables declared as parameters are only available within the macro scope and override global variables with the same name (but do not affect them).

Example:

```
<b>@macro</b> some_macro(a, b, c)
  Hello, @{a}!
  Roses are @{b},
  And violets are @{defined(c) ? c : "of unknown color"}.
<b>@end</b>
```

Then `some_macro` can be used as:

```
<b>@include</b> some_macro("username", 123)
```

which will produce:

```
Hello, username!
Roses are red,
And violets are of unknown color.
```

### @if – <b>@elseif</b> – <b>@else</b>

Conditional directive.

```
<b>@if</b> <test:expression>

  // consequent code

<b>@elseif</b> <test:expression>

  else if #1 code

...more elseifs...

<b>@else</b>

  // alternate code

<b>@endif</b>
```

_`<b>@endif</b>` can be replaced with `<b>@end</b>`._

Example:

```
<b>@if</b> __FILE__ == 'abc.ext'
  // include something
<b>@elseif</b> __FILE__ == 'def.ext'
  // include something else
<b>@else</b>
  // something completely different
<b>@endif</b>
```

### @{...} (inline expressions)

```
@{expression}
```

Inserts the value of the enclosed expression.

Example:

```
<b>@set</b> name "Someone"
Hello, @{name}, the result is: @{123 * 456}.
```

results in the following output:

```
Hello, Someone, the result is: 56088.
```

### @error

```
<b>@error</b> <message:expression>
````

Emits an error.

Example:

```
<b>@if</b> PLATFORM == "platform1"
  // platform 1 code
<b>@elseif</b> PLATFORM == "platform2"
  // platform 2 code
<b>@elseif</b> PLATFORM == "platform3"
  // platform 3 code
<b>@else</b>
  <b>@error</b> "Platform is " + PLATFORM + " is unsupported"
<b>@endif</b>
```

### @include

Includes local file, external source or a macro.

```
<b>@include</b> <source:expression>
```

#### Macro

```
<b>@include</b> some_macro("username", 123)
```

#### Local Files

```
<b>@include</b> "somefile.ext"
```

#### Remote Files

```
<b>@include</b> "http://example.com/file.ext"
```

```
<b>@include</b> "https://example.com/file.ext"
```

#### From Git Repository

```
<b>@include</b> "<repository_url>.git/<path>/<to>/<file>@<ref>"
```

For example, importing file from _GitHub_ looks like:

- Head of the default branch

  ```
  <b>@include</b> "https://github.com/electricimp/Builder.git/README.md"
  ```

- Head of the _master_ branch

  ```
  <b>@include</b> "https://github.com/electricimp/Builder.git/README.md<b>@master</b>"
  ```

- Tag _v1.2.3_:

  ```
  <b>@include</b> "https://github.com/electricimp/Builder.git/README.md<b>@v1</b>.2.3"
  ```

- Latest existing tag

  ```
  <b>@include</b> "https://github.com/electricimp/Builder.git/README.md<b>@latest</b>"
  ```

## Expressions

Directives that have parameters allow usage of _expression_ syntax.

For example:

- `<b>@include</b> <path:expression>`
- `<b>@set</b> <variable:identifier> <value:expression>`
- `<b>@if</b> <condition:expression>`
- `<b>@elseif</b> <condition:expression>`
- `@{expression}` (inline expressions)

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

```
Hi from line @{__LINE__}!
```

#### \_\_FILE\_\_

Name of the file in which this variable appears.

Example:

```
Hi from file @{__FILE__}!
```

### Functions

- `min(<numbers>)`
- `max(<numbers>)`
- `abs(<number>)`
- `defined(<variable_name>)` – returns `true` if _<variable_name>_ is defined or `false` otherwise.

## Comments

Directives can contain both `//`- and `/**/`-style comments.

# License

MIT
