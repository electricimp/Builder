<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Syntax](#syntax)
  - [Directives](#directives)
    - [@set](#@set)
    - [@macro](#@macro)
    - [@if – @elseif – @else](#@if-%E2%80%93-@elseif-%E2%80%93-@else)
    - [@{...} (inline expressions)](#@-inline-expressions)
    - [@error](#@error)
    - [@include](#@include)
      - [Macro](#macro)
      - [Local Files](#local-files)
      - [Remote Files](#remote-files)
      - [Git Repositories](#git-repositories)
  - [Expressions](#expressions)
    - [Types](#types)
    - [Operators](#operators)
      - [Binary](#binary)
      - [Unary](#unary)
    - [Member Expressions](#member-expressions)
    - [Conditional Expressions](#conditional-expressions)
    - [Variables](#variables)
    - [Functions](#functions)
  - [Comments](#comments)
  - [Predefined Variables](#predefined-variables)
      - [\_\_LINE\_\_](#%5C_%5C_line%5C_%5C_)
      - [\_\_FILE\_\_](#%5C_%5C_file%5C_%5C_)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


<br /><img src=docs/logo.png width=200 alt=Builder><br /><br />

_Builder_ language combines a preprocessor with an expression language and advanced importing.

_Please note that the works is in-progress and published for preview purposes only._

# Syntax

## Directives

Directives start with `@` symbol.

### @set

```
@set <variable:identifier> <value:expression>
```
```
@set <variable:identifier> = <value:expression>
```

Assigns a value of an _expression_ to a _variable_.

Variables are defined in a _global_ context.

Example:

_Sets SOMEVAR to 1:_

```
@set SOMEVAR min(1, 2, 3)
```

### @macro

```
@macro <name>(<arguments)
  <body>
@endmacro
```

_`@end` directive can be used instead of `@endmacro`._

Declares a block of code that can take parameters and can be reused with an `@include` statement. Once declared macros

Variables declared as parameters are only available within the macro scope and override global variables with the same name (but do not affect them).

Example:

```
@macro some_macro(a, b, c)
  Hello, @{a}!
  Roses are @{b},
  And violets are @{defined(c) ? c : "of unknown color"}.
@end
```

Then `some_macro` can be used as:

```
@include some_macro("username", 123)
```

which will produce:

```
Hello, username!
Roses are red,
And violets are of unknown color.
```

### @if – @elseif – @else

### @{...} (inline expressions)

### @error

### @include

#### Macro
#### Local Files
#### Remote Files
#### Git Repositories

## Expressions

Directives that have parameters allow usage of _expression_ syntax.

For example:

- `@include <path:expression>`
- `@set <variable:identifier> <value:expression>`
- `@if <condition:expression>`
- `@elseif <condition:expression>`
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

- Variables defined by `@set` statements are available in expressions.
- Undefined variables are evaluated as `null`.
- Variable names can contain `$`, `_`, latin letters and digits and can start only with a non-digit.

### Functions

- `min(<numbers>)`
- `max(<numbers>)`
- `abs(<number>)`
- `defined(<variable_name>)` – returns `true` if _<variable_name>_ is defined or `false` otherwise.

## Comments

Directives can contain both `//`- and `/**/`-style comments.

## Predefined Variables

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

# License

MIT
