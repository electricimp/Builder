@{S.concat("a")}
@{S.concat("a", "b")}
@{S.concat("a", "b", "c")}

@{S.endsWith("abc", "a")}
@{S.endsWith("abc", "c")}

@{S.includes("abc", "x")}
@{S.includes("abc", 1)}
@{S.includes("abc", "a")}
@{S.includes("abc", "abc")}

@{S.repeat("abc", 0)}
@{S.repeat("abc", 1)}
@{S.repeat("abc", 2)}

@{S.split("abc", "x")}
@{S.split("abc", "")}
@{S.split("abc", "")[1]}

@{S.startsWith("abc", "a")}
@{S.startsWith("abc", "ab")}
@{S.startsWith("abc", "z")}

@{S.substr("abc", 1)}
@{S.substr("abc", 1, 1)}

@{S.substring("abc", 1)}
@{S.substring("abc", 1, 2)}
@{S.substring("abc", 1, 3)}

@{S.toLowerCase("Abc")}

@{S.toUpperCase("abc")}

@{S.trim(" abc ")}

@{S.trimLeft(" abc ")}

@{S.trimRight(" abc ")}

@{S.trimRight(S.trimLeft(" abc "))}
