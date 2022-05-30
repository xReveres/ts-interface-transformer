"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const typescript_1 = __importStar(require("typescript"));
exports.default = (program) => {
    return (ctx) => {
        return (sourceFile) => {
            const visitor = (node) => {
                return typescript_1.default.visitEachChild(visitNode(node, program), visitor, ctx);
            };
            return typescript_1.default.visitEachChild(visitNode(sourceFile, program), visitor, ctx);
        };
    };
};
const symbolMap = new Map();
const visitNode = (node, program) => {
    if (node.kind === typescript_1.default.SyntaxKind.SourceFile) {
        node['locals'].forEach((symbol, key) => {
            if (!symbolMap.has(key)) {
                symbolMap.set(key, symbol);
            }
        });
    }
    const typeChecker = program.getTypeChecker();
    if (isFnCallExpression("keys", node, typeChecker)) {
        if (!node.typeArguments) {
            return typescript_1.factory.createArrayLiteralExpression([]);
        }
        const type = typeChecker.getTypeFromTypeNode(node.typeArguments[0]);
        const properties = typeChecker.getPropertiesOfType(type);
        return typescript_1.factory.createArrayLiteralExpression(properties.map(property => typescript_1.factory.createStringLiteral(property.name)));
    }
    else if (isFnCallExpression("typeInfo", node, typeChecker)) {
        if (!node.typeArguments) {
            return typescript_1.factory.createArrayLiteralExpression([]);
        }
        let multiLine = false;
        if (node.arguments.length) {
            multiLine = node.arguments[0].kind == typescript_1.default.SyntaxKind.TrueKeyword;
        }
        return getTypeInfo(node.typeArguments[0], typeChecker, multiLine);
    }
    return node;
};
const getTypeInfo = (typeNode, typeChecker, multiLine) => {
    const type = typeChecker.getTypeFromTypeNode(typeNode);
    let properties = [];
    const symbols = typeChecker.getPropertiesOfType(type);
    symbols.forEach(s => {
        if (!s.valueDeclaration)
            return;
        const prop = getPropertyInfo(s.valueDeclaration, typeChecker, multiLine);
        if (prop)
            properties.push(prop);
    });
    const infoObject = [];
    if (type.isClassOrInterface()) {
        if (type.symbol) {
            infoObject.push(typescript_1.factory.createPropertyAssignment(typescript_1.factory.createStringLiteral("name"), typescript_1.factory.createStringLiteral(type.symbol.getName())));
        }
        infoObject.push(typescript_1.factory.createPropertyAssignment(typescript_1.factory.createStringLiteral("type"), getPropertyType(type)));
        infoObject.push(typescript_1.factory.createPropertyAssignment(typescript_1.factory.createStringLiteral("properties"), typescript_1.factory.createArrayLiteralExpression(properties)));
    }
    else {
        infoObject.push(typescript_1.factory.createPropertyAssignment(typescript_1.factory.createStringLiteral("type"), getPropertyType(typeNode)));
        if (typeNode.kind == typescript_1.default.SyntaxKind.TypeLiteral) {
            const type = typeNode;
            infoObject.push(typescript_1.factory.createPropertyAssignment(typescript_1.factory.createStringLiteral("properties"), typescript_1.factory.createArrayLiteralExpression(type.members
                .map(m => getPropertyInfo(m, typeChecker, multiLine))
                .filter(m => typeof m !== 'undefined'))));
        }
    }
    return typescript_1.factory.createObjectLiteralExpression(infoObject, multiLine);
};
const getPropertyInfo = (decl, typeChecker, multiLine) => {
    if (decl.kind != typescript_1.default.SyntaxKind.PropertyDeclaration && decl.kind != typescript_1.default.SyntaxKind.PropertySignature)
        return;
    const property = decl;
    const objectArray = [
        typescript_1.factory.createPropertyAssignment(typescript_1.factory.createStringLiteral("name"), typescript_1.factory.createStringLiteral(property.name.getText())),
        typescript_1.factory.createPropertyAssignment(typescript_1.factory.createStringLiteral("type"), getPropertyType(property.type))
    ];
    if (property.questionToken) {
        objectArray.push(typescript_1.factory.createPropertyAssignment(typescript_1.factory.createStringLiteral("optional"), typescript_1.factory.createTrue()));
    }
    if (property.type && property.type.kind == typescript_1.default.SyntaxKind.TypeLiteral) {
        const type = property.type;
        objectArray.push(typescript_1.factory.createPropertyAssignment(typescript_1.factory.createStringLiteral("properties"), typescript_1.factory.createArrayLiteralExpression(type.members
            .map(m => getPropertyInfo(m, typeChecker, multiLine))
            .filter(m => typeof m !== 'undefined'))));
    }
    if (property.type && property.type.kind == typescript_1.default.SyntaxKind.TypeReference) {
        const type = property.type;
        if (type.typeArguments) {
            objectArray.push(typescript_1.factory.createPropertyAssignment(typescript_1.factory.createStringLiteral("typeArguments"), typescript_1.factory.createArrayLiteralExpression(type.typeArguments
                .map(t => getTypeInfo(t, typeChecker, multiLine)))));
        }
    }
    return typescript_1.factory.createObjectLiteralExpression(objectArray, multiLine);
};
const getPropertyType = (type) => {
    if (typeof type.intrinsicName === 'string') {
        return typescript_1.factory.createStringLiteral(type.intrinsicName);
    }
    if (type.types || type.kind == typescript_1.default.SyntaxKind.UnionType || type.kind == typescript_1.default.SyntaxKind.IntersectionType) {
        return typescript_1.factory.createArrayLiteralExpression(type.types.map((token) => getPropertyType(token)));
    }
    let typeName = '';
    switch (type.kind) {
        case typescript_1.default.SyntaxKind.UndefinedKeyword:
            typeName = 'undefined';
            break;
        case typescript_1.default.SyntaxKind.ArrayType:
            typeName = 'array';
            break;
        case typescript_1.default.SyntaxKind.StringKeyword:
            typeName = 'string';
            break;
        case typescript_1.default.SyntaxKind.NumberKeyword:
            typeName = 'number';
            break;
        case typescript_1.default.SyntaxKind.BigIntKeyword:
            typeName = 'bigint';
            break;
        case typescript_1.default.SyntaxKind.BooleanKeyword:
            typeName = 'boolean';
            break;
        case typescript_1.default.SyntaxKind.FunctionType:
            typeName = 'Function';
            break;
        case typescript_1.default.SyntaxKind.TypeReference:
            typeName = type.typeName.escapedText;
            break;
        case typescript_1.default.SyntaxKind.AnyKeyword:
            typeName = 'any';
            break;
        case typescript_1.default.SyntaxKind.NullKeyword:
            typeName = 'null';
            break;
        case typescript_1.default.SyntaxKind.ObjectKeyword:
            typeName = 'object';
            break;
        case typescript_1.default.SyntaxKind.TypeLiteral:
            typeName = 'object';
            break;
        default:
            if (typeof type.isClass === 'function' && typeof type.isClassOrInterface === 'function' && type.isClassOrInterface())
                typeName = type.isClass() ? 'class' : 'interface';
            else
                typeName = 'unknown';
    }
    return typescript_1.factory.createStringLiteral(typeName);
};
const indexTs = path.join(__dirname, './index.ts');
const isFnCallExpression = (name, node, typeChecker) => {
    if (!typescript_1.default.isCallExpression(node)) {
        return false;
    }
    const signature = typeChecker.getResolvedSignature(node);
    if (typeof signature === 'undefined') {
        return false;
    }
    const { declaration } = signature;
    return !!declaration
        && !typescript_1.default.isJSDocSignature(declaration)
        && (path.join(declaration.getSourceFile().fileName) === indexTs)
        && !!declaration.name
        && declaration.name.getText() === name;
};
