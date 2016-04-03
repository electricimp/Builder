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
    expect(r).toEqual([{'line':1,'file':'main','type':'source_line','value':'// main 1'},{'line':2,'file':'main','type':'if','test':'1','consequent':[{'line':3,'file':'main','type':'source_line','value':'// then:1'}],'alternate':[{'line':5,'file':'main','type':'source_line','value':'// else:1'}]},{'line':7,'file':'main','type':'source_line','value':'// main (last)'}]);

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
    expect(r).toEqual([{'line':1,'file':'main','type':'source_line','value':'// main 1'},{'line':2,'file':'main','type':'if','test':'1','consequent':[{'line':3,'file':'main','type':'source_line','value':'  // then:1'}],'elseifs':[{'line':4,'file':'main','type':'if','test':'1','consequent':[{'line':5,'file':'main','type':'source_line','value':'  // elseif 1:1'},{'line':6,'file':'main','type':'source_line','value':'  // elseif 1:2'},{'line':7,'file':'main','type':'source_line','value':'  // elseif 1:3'}]},{'line':8,'file':'main','type':'if','test':'2','consequent':[{'line':9,'file':'main','type':'source_line','value':'  // elseif 2:1'},{'line':10,'file':'main','type':'source_line','value':'  // elseif 2:2'}]}],'alternate':[{'line':12,'file':'main','type':'source_line','value':'  // else:1'}]},{'line':14,'file':'main','type':'source_line','value':'// main (last)'}]);

  });
});
