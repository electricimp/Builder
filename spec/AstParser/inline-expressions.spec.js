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
  it('should detect inline expressions', () => {
    const r = p.parse(
`// main 1
// main 2 @{expr1} @{}
`
    );

    //noinspection Eslint
    expect(r).toEqual([{'_line':1,'_file':'main','type':'output','value':'// main 1\n','computed':true},{'_line':2,'_file':'main','type':'output','value':'// main 2 ','computed':true},{'_line':2,'_file':'main','type':'output','value':'expr1','computed':false},{'_line':2,'_file':'main','type':'output','value':' ','computed':true},{'_line':2,'_file':'main','type':'output','value':'','computed':false},{'_line':2,'_file':'main','type':'output','value':'\n','computed':true}]);

    // console.error(JSON.stringify(r).replace(/\"/g, '\''));
    // console.error(JSON.stringify(r, null, '  '));
  });
});
