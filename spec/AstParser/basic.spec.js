// Copyright (c) 2016-2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');

const AstParser = require('../../src/AstParser');

describe('AstParser', () => {
  let p;

  beforeEach(() => {
    p = new AstParser();
  });

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

    expect(r).toEqual(
      [
        {
          '_line': 1,
          'type': 'output',
          'value': '// main 1\n',
          'computed': true
        },
        {
          '_line': 2,
          'type': 'conditional',
          'test': '1',
          'consequent': [
            {
              '_line': 3,
              'type': 'output',
              'value': '// then:1\n',
              'computed': true
            }
          ],
          'alternate': [
            {
              '_line': 5,
              'type': 'output',
              'value': '// else:1\n',
              'computed': true
            }
          ]
        },
        {
          '_line': 7,
          'type': 'output',
          'value': '// main (last)',
          'computed': true
        }
      ]
    );

    // console.error(JSON.stringify(r, null, '  ').replace(/\'/g, '\''));
  });

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

    // console.error(JSON.stringify(r, null, '  ').replace(/\"/g, '\''));

    expect(r).toEqual(
      [
        {
          '_line': 1,
          'type': 'output',
          'value': '// main 1\n',
          'computed': true
        },
        {
          '_line': 2,
          'type': 'conditional',
          'test': '1',
          'consequent': [
            {
              '_line': 3,
              'type': 'output',
              'value': '  // then:1\n',
              'computed': true
            }
          ],
          'elseifs': [
            {
              '_line': 4,
              'type': 'conditional',
              'test': '1',
              'consequent': [
                {
                  '_line': 5,
                  'type': 'output',
                  'value': '  // elseif 1:1\n',
                  'computed': true
                },
                {
                  '_line': 6,
                  'type': 'output',
                  'value': '  // elseif 1:2\n',
                  'computed': true
                },
                {
                  '_line': 7,
                  'type': 'output',
                  'value': '  // elseif 1:3\n',
                  'computed': true
                }
              ]
            },
            {
              '_line': 8,
              'type': 'conditional',
              'test': '2',
              'consequent': [
                {
                  '_line': 9,
                  'type': 'output',
                  'value': '  // elseif 2:1\n',
                  'computed': true
                },
                {
                  '_line': 10,
                  'type': 'output',
                  'value': '  // elseif 2:2\n',
                  'computed': true
                }
              ]
            }
          ],
          'alternate': [
            {
              '_line': 12,
              'type': 'output',
              'value': '  // else:1\n',
              'computed': true
            }
          ]
        },
        {
          '_line': 14,
          'type': 'output',
          'value': '// main (last)',
          'computed': true
        }
      ]
    );

  });

  it('should parse alternative end directive', () => {
    const res = p.parse
(`@if 1
@end
@macro abc()
@end`);

    // console.log(JSON.stringify(res, null, '    '));

    expect(res).toEqual([
      {
        '_line': 1,
        'type': 'conditional',
        'test': '1',
        'consequent': []
      },
      {
        '_line': 3,
        'type': 'macro',
        'declaration': 'abc()',
        'body': []
      }
    ]);
  });

  it('should parse enclosed curly brackets', () => {
    const res = p.parse
(`@macro set(val)
local var1 = @{val};
@end
@{set('{}')}
`);
   //console.log(JSON.stringify(res, null, '    '));

   expect(res).toEqual([
    {
        "_line": 1,
        "type": "macro",
        "declaration": "set(val)",
        "body": [
            {
                "_line": 2,
                "type": "output",
                "value": "local var1 = ",
                "computed": true
            },
            {
                "_line": 2,
                "type": "output",
                "value": "val",
                "computed": false
            },
            {
                "_line": 2,
                "type": "output",
                "value": ";\n",
                "computed": true
            }
        ]
    },
    {
        "_line": 4,
        "type": "output",
        "value": "set('{}')",
        "computed": false
    },
    {
        "_line": 4,
        "type": "output",
        "value": "\n",
        "computed": true
    }
    ]);
  });

});
