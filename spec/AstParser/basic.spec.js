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
    expect(r).toEqual([{'line':1,'file':'main','type':'output','computed':true,'value':'// main 1\n'},{'line':2,'file':'main','type':'conditional','test':'1','consequent':[{'line':3,'file':'main','type':'output','computed':true,'value':'// then:1\n'}],'alternate':[{'line':5,'file':'main','type':'output','computed':true,'value':'// else:1\n'}]},{'line':7,'file':'main','type':'output','computed':true,'value':'// main (last)'}]);

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
    expect(r).toEqual([{'line':1,'file':'main','type':'output','computed':true,'value':'// main 1\n'},{'line':2,'file':'main','type':'conditional','test':'1','consequent':[{'line':3,'file':'main','type':'output','computed':true,'value':'  // then:1\n'}],'elseifs':[{'line':4,'file':'main','type':'conditional','test':'1','consequent':[{'line':5,'file':'main','type':'output','computed':true,'value':'  // elseif 1:1\n'},{'line':6,'file':'main','type':'output','computed':true,'value':'  // elseif 1:2\n'},{'line':7,'file':'main','type':'output','computed':true,'value':'  // elseif 1:3\n'}]},{'line':8,'file':'main','type':'conditional','test':'2','consequent':[{'line':9,'file':'main','type':'output','computed':true,'value':'  // elseif 2:1\n'},{'line':10,'file':'main','type':'output','computed':true,'value':'  // elseif 2:2\n'}]}],'alternate':[{'line':12,'file':'main','type':'output','computed':true,'value':'  // else:1\n'}]},{'line':14,'file':'main','type':'output','computed':true,'value':'// main (last)'}]);

  });
});
