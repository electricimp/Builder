
@ test error generation

@if TEST == "set"
  @include "set.inc.nut"
@elseif TEST == "expression"  || !TEST
  @include "expression.inc.nut"
@endif
