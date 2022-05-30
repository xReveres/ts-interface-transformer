
export interface TypeInfo {
    name?: string;
    type: string | string[];
    properties?: Property[];
}

export interface Property {
    name: string;
    optional?: true;
    type: string | string[];
    properties?: Property[];
    typeArguments?: TypeInfo[]
}

export declare function typeInfo<T extends object>(): Array<TypeInfo>;
export declare function typeInfo<T extends object>(multiLine: true): Array<TypeInfo>;
export declare function keys<T extends object>(): Array<keyof T>;