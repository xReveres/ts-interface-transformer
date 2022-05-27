# ts-interface-transformer

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
    k?: string
}

var i = typeInfo<Foo>(true);
```

Transforms to: 

```js
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
            "type": "array"
        }, {
            "name": "c",
            "type": "Array",
            "typeArguments": [{
                    "type": "number"
                }]
        }, {
            "name": "d",
            "type": "array"
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
        }]
};
```