
export enum TypeName {
    unknown = 'unknown',
    undefined = 'undefined',
    array = 'array',
    string = 'string',
    number = 'number',
    bigint = 'bigint',
    boolean = 'boolean',
    Function = 'Function',
    any = 'any',
    null = 'null',
    object = 'object',
    class = 'class',
    interface = 'interface'
}

export interface TypeInfo {
    name?: string;
    type: string | string[];
    properties?: Property[];
    typeArguments?: TypeInfo[],
    elementType?: TypeInfo[]
}

export interface Property {
    name: string;
    optional?: true;
    type: string | string[];
    properties?: Property[];
    typeArguments?: TypeInfo[],
    elementType?: TypeInfo[]
}

export declare function typeInfo<T extends object>(): TypeInfo;
export declare function typeInfo<T extends object>(multiLine: true): TypeInfo;
export declare function keys<T extends object>(): Array<keyof T>;