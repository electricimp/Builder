@include "inc-a.nut"

@macro macro1(arg1, arg2)
// macro1 line 1 # @{__FILE__}
@include macro2(1, 2)
// macro1 line 2 # @{__FILE__}
@endmacro

@include macro1(1, "something1")
@include macro2(2, "something2", true)
