// ----------------------------------------------------
// FILE: @{__FILE__}
// PATH: @{__PATH__}

// Main agent file:
// Path from Project root directory: BuilderRelativeIncludeTesting/src/agent/main.agent.nut

@include "supporting.agent.nut"
@include "../shared/constants.shared.nut"
@include "../../libs/myLibrary.lib.nut"

@ @include __PATH__ + "/supporting.agent.nut"
@ @include __PATH__ + "/../shared/constants.shared.nut"
@ @include __PATH__ + "/../../libs/myLibrary.lib.nut"


server.log("Main agent file running...");
// ----------------------------------------------------
