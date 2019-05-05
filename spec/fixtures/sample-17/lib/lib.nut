@if USE_INCLUDES
    "==== USE_INCLUDES BEGIN ===="
    @include "lib/libDependency.nut"
    @include "libDependency.nut"
    @include "../libDependency.nut"
    @include "../lib1/libDependency.nut"
    @include "../lib1/lib1/libDependency.nut"
    @include "../lib1/lib1/../libDependency1.nut"
    "==== USE_INCLUDES END ======"
@endif

@if USE_WIN_INCLUDES
    "==== USE_WIN_INCLUDES BEGIN ===="
    @include "lib\\libDependency.nut"
    @include "libDependency.nut"
    @include "..\\libDependency.nut"
    @include "..\\lib1\\libDependency.nut"
    @include "..\\lib1\\lib1\\libDependency.nut"
    @include "..\\lib1\\lib1\\..\\libDependency1.nut"
    "==== USE_WIN_INCLUDES END ======"
@endif

@if USE_ABSOLUTE_INCLUDES
    "==== USE_ABSOLUTE_INCLUDES BEGIN ===="
    @include __PATH__ + "/lib/libDependency.nut"
    @include __PATH__ + "/libDependency.nut"
    @include __PATH__ + "/../libDependency.nut"
    @include __PATH__ + "/../lib1/libDependency.nut"
    @include __PATH__ + "/../lib1/lib1/libDependency.nut"
    @include __PATH__ + "/../lib1/lib1/../libDependency1.nut"
    "==== USE_ABSOLUTE_INCLUDES END ======"
@endif

@if USE_WIN_ABSOLUTE_INCLUDES
    "==== USE_WIN_ABSOLUTE_INCLUDES BEGIN ===="
    @include __PATH__ + "\\lib\\libDependency.nut"
    @include __PATH__ + "\\libDependency.nut"
    @include __PATH__ + "\\..\\libDependency.nut"
    @include __PATH__ + "\\..\\lib1\\libDependency.nut"
    @include __PATH__ + "\\..\\lib1\\lib1\\libDependency.nut"
    @include __PATH__ + "\\..\\lib1\\lib1\\..\\libDependency1.nut"
    "==== USE_WIN_ABSOLUTE_INCLUDES END ======"
@endif

@if INCLUDE_NOT_EXIST
    "==== INCLUDE_NOT_EXIST BEGIN ===="
    @include "../libNotExist.nut"
    "==== INCLUDE_NOT_EXIST END ======"
@endif

@if INCLUDE_NOT_EXIST_ERROR
    "==== INCLUDE_NOT_EXIST_ERROR BEGIN ===="
    @include "../libNotExist.nut"
    "==== INCLUDE_NOT_EXIST_ERROR END ======"
@endif

@if INCLUDE_OUT_OF_REPO_ERROR
    "==== INCLUDE_OUT_OF_REPO_ERROR BEGIN ===="
    @include "../libOutOfRepo.nut"
    "==== INCLUDE_OUT_OF_REPO_ERROR END ======"
@endif

local str = "lib.nut level 1";