@macro inc(step)
	@{a} @{__FILE__} @{__LINE__}
	@set a (a + (step == null ? 1 : step))
	@{a} @{__FILE__} @{__LINE__}
	@{defined(dec)} @{__FILE__} @{__LINE__}
	@if !defined(dec)
		@macro dec(step)
			@{a} @{__FILE__} @{__LINE__}
			@{inc(step == null ? -1 : -step)}
			@{a} @{__FILE__} @{__LINE__}
		@endmacro
	@endif
	@{defined(dec)} @{__FILE__} @{__LINE__}
@endmacro
