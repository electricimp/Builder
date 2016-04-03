/**
 * Spec for AST Parser
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

require('jasmine-expect');

const AstParser = require('../../src/AstParser');

describe('AstParser', () => {
  let p;

  beforeEach(() => {
    p = new AstParser();
  });

  //noinspection Eslint
  it('should do something alright #1', () => {
    const r = p.parse(
`// main 1
@if 1
// then:1
@else
// else:1
@endif
// main (last)`
    );

  //noinspection Eslint
    expect(r).toEqual([{"_line":1,"_file":'main','type':'output','computed':true,'value':'// main 1\n'},{"_line":2,"_file":'main','type':'conditional','test':'1','consequent':[{"_line":3,"_file":'main','type':'output','computed':true,'value':'// then:1\n'}],'alternate':[{"_line":5,"_file":'main','type':'output','computed':true,'value':'// else:1\n'}]},{"_line":7,"_file":'main','type':'output','computed':true,'value':'// main (last)'}]);

    // console.error(JSON.stringify(r).replace(/\"/g, '\''));
    // console.error(JSON.stringify(r, null, '  '));
  });

  //noinspection Eslint
  it('should do something alright #2', () => {
    const r = p.parse(
      `// main 1
@if 1
  // then:1
@elseif 1
  // elseif 1:1
  // elseif 1:2
  // elseif 1:3
@elseif 2
  // elseif 2:1
  // elseif 2:2
@else
  // else:1
@endif
// main (last)`
    );

    // console.error(JSON.stringify(r).replace(/\"/g, '\''));
    // console.error(JSON.stringify(r, null, '  '));

    //noinspection Eslint
    expect(r).toEqual([{"_line":1,"_file":'main','type':'output','computed':true,'value':'// main 1\n'},{"_line":2,"_file":'main','type':'conditional','test':'1','consequent':[{"_line":3,"_file":'main','type':'output','computed':true,'value':'  // then:1\n'}],'elseifs':[{"_line":4,"_file":'main','type':'conditional','test':'1','consequent':[{"_line":5,"_file":'main','type':'output','computed':true,'value':'  // elseif 1:1\n'},{"_line":6,"_file":'main','type':'output','computed':true,'value':'  // elseif 1:2\n'},{"_line":7,"_file":'main','type':'output','computed':true,'value':'  // elseif 1:3\n'}]},{"_line":8,"_file":'main','type':'conditional','test':'2','consequent':[{"_line":9,"_file":'main','type':'output','computed':true,'value':'  // elseif 2:1\n'},{"_line":10,"_file":'main','type':'output','computed':true,'value':'  // elseif 2:2\n'}]}],'alternate':[{"_line":12,"_file":'main','type':'output','computed':true,'value':'  // else:1\n'}]},{"_line":14,"_file":'main','type':'output','computed':true,'value':'// main (last)'}]);

  });
});
