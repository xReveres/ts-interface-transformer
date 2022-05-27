import { typeInfo, keys } from '../index';

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

// Extracted keys
var k = keys<Foo>();

// Extracted interface information
var i = typeInfo<Foo>(true);