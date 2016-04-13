@{__FILE__}:@{__LINE__} // main.nut:1

@include "a.nut"

@{A} // 123

@macro M(A)
  @{A} // 456 - local A overrides global A
  @{__FILE__} // main.nut
@end

@include M(456)

@{A} // 123 - global A should be used

@include M2(1,2,3)
@{a} // null - should not be defined here
