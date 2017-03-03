@macro m(a)
local variable = @{a};
@end
@include m()
@include m("{}")
@include m("a1")
@include m("a2", "b")

@{m(asdf)}
@{m("a3")}
@{m("a4", "b")}
@{m("a5")} @{m("a6")} @{m("a7")}
