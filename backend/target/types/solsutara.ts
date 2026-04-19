/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/solsutara.json`.
 */
export type Solsutara = {
  "address": "3Kzq31P89HkR8SEofcmE8AU52pCdAxyFUwwFFscJHxgm",
  "metadata": {
    "name": "solsutara",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "SolSutara — decentralized supply chain traceability on Solana"
  },
  "instructions": [
    {
      "name": "createComponent",
      "discriminator": [
        73,
        210,
        101,
        82,
        179,
        122,
        123,
        242
      ],
      "accounts": [
        {
          "name": "component",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  112,
                  111,
                  110,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "account",
                "path": "counter.total_components",
                "account": "globalCounter"
              }
            ]
          }
        },
        {
          "name": "counter",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  117,
                  110,
                  116,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "metadataUri",
          "type": "string"
        }
      ]
    },
    {
      "name": "initializeCounter",
      "discriminator": [
        67,
        89,
        100,
        87,
        231,
        172,
        35,
        124
      ],
      "accounts": [
        {
          "name": "counter",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  117,
                  110,
                  116,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "linkComponents",
      "discriminator": [
        77,
        241,
        129,
        168,
        119,
        68,
        196,
        20
      ],
      "accounts": [
        {
          "name": "parentComponent",
          "docs": [
            "Parent component — validated via PDA seeds stored in account data"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  112,
                  111,
                  110,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "parent_component.creator",
                "account": "component"
              },
              {
                "kind": "account",
                "path": "parent_component.component_id",
                "account": "component"
              }
            ]
          }
        },
        {
          "name": "childComponent",
          "docs": [
            "Child component — mutable, parents vec will be updated"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  112,
                  111,
                  110,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "child_component.creator",
                "account": "component"
              },
              {
                "kind": "account",
                "path": "child_component.component_id",
                "account": "component"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "parentComponentId",
          "type": "u64"
        },
        {
          "name": "childComponentId",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "component",
      "discriminator": [
        181,
        150,
        112,
        185,
        188,
        5,
        202,
        239
      ]
    },
    {
      "name": "globalCounter",
      "discriminator": [
        42,
        206,
        176,
        58,
        175,
        129,
        130,
        233
      ]
    }
  ],
  "events": [
    {
      "name": "componentCreated",
      "discriminator": [
        193,
        239,
        154,
        112,
        95,
        168,
        0,
        245
      ]
    },
    {
      "name": "componentLinked",
      "discriminator": [
        78,
        161,
        97,
        127,
        99,
        249,
        101,
        116
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "emptyMetadataUri",
      "msg": "Metadata URI cannot be empty"
    },
    {
      "code": 6001,
      "name": "metadataUriTooLong",
      "msg": "Metadata URI exceeds maximum length of 200 characters"
    },
    {
      "code": 6002,
      "name": "counterOverflow",
      "msg": "Global component counter overflow"
    },
    {
      "code": 6003,
      "name": "selfLink",
      "msg": "A component cannot be linked to itself"
    },
    {
      "code": 6004,
      "name": "duplicateLink",
      "msg": "This parent-child relationship already exists"
    },
    {
      "code": 6005,
      "name": "tooManyParents",
      "msg": "Component already has the maximum number of parents (10)"
    }
  ],
  "types": [
    {
      "name": "component",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "componentId",
            "type": "u64"
          },
          {
            "name": "metadataUri",
            "type": "string"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "parents",
            "docs": [
              "IDs of parent components (up to 10 parents per component)"
            ],
            "type": {
              "vec": "u64"
            }
          }
        ]
      }
    },
    {
      "name": "componentCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "componentId",
            "type": "u64"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "componentLinked",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "parentComponentId",
            "type": "u64"
          },
          {
            "name": "childComponentId",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "globalCounter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "totalComponents",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
