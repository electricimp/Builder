@include "inc-a.nut"

@define SOMEVAR1 123
@define SOMEVAR2 256

@undefine SOMEVAR1

@if SOMEVAR1 == 123
  // should not be included
@elseif SOMEVAR2 == 0
  // should not be included
@elseif SOMEVAR2 == 256
  // should be included
@endif

@if SOMEVAR2
  // should be included
@endif
