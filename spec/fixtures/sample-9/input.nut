@macro m(a)
local variable = @{a};
@end
@include m()
@include m("a1")
@include m("a2", "b")

@{m()}
@{m("a3")}
@{m("a4", "b")}
