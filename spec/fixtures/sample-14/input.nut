@macro HEADER(fname)
@set file upper(fname)
// =============================================================================
// @{file} @{repeat("-", 76 - length(file))}
// ============================================================================{

@endmacro

@macro FOOTER(fname)
@set filename split(fname, ".", 0)
@set file upper(filename)

// =============================================================================
// @{repeat("-", 72 - length(file))} END_@{file}
// ============================================================================}
@endmacro


@{HEADER(__FILE__)}
// Test my stuff!
@{FOOTER(__FILE__)}
