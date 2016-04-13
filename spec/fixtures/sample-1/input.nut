@include "inc-a.nut"

@set SOMEVAR1 123
@set SOMEVAR2 256

@if SOMEVAR1 == 123
  // should be included

  @if null
    @set abc def
    // alternate syntax for @set
    @set abc=def
    @set abc= def
  @else
    // l2 else
  @end

@elseif SOMEVAR2 == 0
  // should not be included
@elseif SOMEVAR2 == 256
  // should not be included
  // @{__FILE__}:@{__LINE__}
  // should not be included
@endif

@if SOMEVAR2
  // should be included
@endif
