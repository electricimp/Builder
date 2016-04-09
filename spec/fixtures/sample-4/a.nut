@{__FILE__}:@{__LINE__} // a.nut:1

// should propagate to global scope
@set A 123

@macro M2(a, b, c)
@{__FILE__}:@{__LINE__} // a.nut:5
@{a} // 1 - local value of a
@endmacro
