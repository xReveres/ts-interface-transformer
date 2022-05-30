# ts-interface-transformer

#### Functions
```ts
function typeInfo<T extends object>(): Array<TypeInfo>;
function typeInfo<T extends object>(multiLine: true): Array<TypeInfo>;
function keys<T extends object>(): Array<keyof T>;
```
---

#### Example
```ts
interface A {
    xyz: string
}

interface Foo {
    a: {
        b: number,
        c: string
    },
    b: number[],
    c: Array<number>,
    d: {
        x: string,
        y: boolean
    }[],
    e: Array<{
        u: number,
        o: object
    }>,
    f: Array<A>
    g: Map<string, A>
    h: boolean,
    i: Date,
    j: Record<string, number>,
    k?: string,
    l: A[],
    m: (string | A)[],
    n: (A | string)[]
}

// Extracted keys
var k = keys<Foo>();

// Extracted interface information
var i = typeInfo<Foo>(true);
```

Transforms to: 

```js
// Extracted keys
var k = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n"];
// Extracted interface information
var i = {
    "name": "Foo",
    "type": "interface",
    "properties": [{
            "name": "a",
            "type": "object",
            "properties": [{
                    "name": "b",
                    "type": "number"
                }, {
                    "name": "c",
                    "type": "string"
                }]
        }, {
            "name": "b",
            "type": "array",
            "elementType": {
                "type": "number"
            }
        }, {
            "name": "c",
            "type": "Array",
            "typeArguments": [{
                    "type": "number"
                }]
        }, {
            "name": "d",
            "type": "array",
            "elementType": {
                "type": "object",
                "properties": [{
                        "name": "x",
                        "type": "string"
                    }, {
                        "name": "y",
                        "type": "boolean"
                    }]
            }
        }, {
            "name": "e",
            "type": "Array",
            "typeArguments": [{
                    "type": "object",
                    "properties": [{
                            "name": "u",
                            "type": "number"
                        }, {
                            "name": "o",
                            "type": "object"
                        }]
                }]
        }, {
            "name": "f",
            "type": "Array",
            "typeArguments": [{
                    "name": "A",
                    "type": "interface",
                    "properties": [{
                            "name": "xyz",
                            "type": "string"
                        }]
                }]
        }, {
            "name": "g",
            "type": "Map",
            "typeArguments": [{
                    "type": "string"
                }, {
                    "name": "A",
                    "type": "interface",
                    "properties": [{
                            "name": "xyz",
                            "type": "string"
                        }]
                }]
        }, {
            "name": "h",
            "type": "boolean"
        }, {
            "name": "i",
            "type": "Date"
        }, {
            "name": "j",
            "type": "Record",
            "typeArguments": [{
                    "type": "string"
                }, {
                    "type": "number"
                }]
        }, {
            "name": "k",
            "type": "string",
            "optional": true
        }, {
            "name": "l",
            "type": "array",
            "elementType": {
                "name": "A",
                "type": "interface",
                "properties": [{
                        "name": "xyz",
                        "type": "string"
                    }]
            }
        }, {
            "name": "m",
            "type": "array",
            "elementType": {
                "type": ["string", "A"]
            }
        }, {
            "name": "n",
            "type": "array",
            "elementType": {
                "type": ["A", "string"]
            }
        }]
};
```