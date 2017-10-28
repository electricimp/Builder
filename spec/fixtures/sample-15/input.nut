@{defined(a)} @{__FILE__} @{__LINE__}
@set a 1
@{defined(a)} @{__FILE__} @{__LINE__}
@{a} @{__FILE__} @{__LINE__}
@set a 0
@{a} @{__FILE__} @{__LINE__}
@{defined(inc)} @{__FILE__} @{__LINE__}
@{defined(dec)} @{__FILE__} @{__LINE__}
@{defined(uinc)} @{__FILE__} @{__LINE__}
@{defined(udec)} @{__FILE__} @{__LINE__}
@include "./macro.nut"
@{defined(inc)} @{__FILE__} @{__LINE__}
@{defined(dec)} @{__FILE__} @{__LINE__}
@{a} @{__FILE__} @{__LINE__}
@{inc()}
@{a} @{__FILE__} @{__LINE__}
@{defined(inc)} @{__FILE__} @{__LINE__}
@{defined(dec)} @{__FILE__} @{__LINE__}
@{inc(2)}
@{a} @{__FILE__} @{__LINE__}
@{dec()}
@{a} @{__FILE__} @{__LINE__}
@{dec(2)}
@{a} @{__FILE__} @{__LINE__}
@{uinc()}
@{a} @{__FILE__} @{__LINE__}
@{uinc(2)}
@{a} @{__FILE__} @{__LINE__}
@{udec()}
@{a} @{__FILE__} @{__LINE__}
@{udec(2)}
@{a} @{__FILE__} @{__LINE__}
