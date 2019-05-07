Use the next Builder (-Dvar val) defines to test different conditions:

Normal cases:
- USE_INCLUDES - POSIX compatible relative include paths.
- USE_WIN_INCLUDES - Windows compatible relative include paths.
- USE_ABSOLUTE_INCLUDES - absolute paths, defined using `__PATH__` variable.
- USE_WIN_ABSOLUTE_INCLUDES - Windows compatible absolute paths, defined using `__PATH__` variable.

Error cases:
- INCLUDE_NOT_EXIST_ERROR - Include not-exist source.
- INCLUDE_OUT_OF_REPO_ERROR - Include path on upper level of github repo.