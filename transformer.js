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
var path = __importStar(require("path"));
var typescript_1 = __importStar(require("typescript"));
exports.default = (function (program) {
    return function (ctx) {
        return function (sourceFile) {
            var visitor = function (node) {
                return typescript_1.default.visitEachChild(visitNode(node, program), visitor, ctx);
            };
            return typescript_1.default.visitEachChild(visitNode(sourceFile, program), visitor, ctx);
        };
    };
});
var symbolMap = new Map();
var visitNode = function (node, program) {
    if (node.kind === typescript_1.default.SyntaxKind.SourceFile) {
        node['locals'].forEach(function (symbol, key) {
            if (!symbolMap.has(key)) {
                symbolMap.set(key, symbol);
            }
        });
    }
    var typeChecker = program.getTypeChecker();
    if (isFnCallExpression("keys", node, typeChecker)) {
        if (!node.typeArguments) {
            return typescript_1.factory.createArrayLiteralExpression([]);
        }
        var type = typeChecker.getTypeFromTypeNode(node.typeArguments[0]);
        var properties = typeChecker.getPropertiesOfType(type);
        return typescript_1.factory.createArrayLiteralExpression(properties.map(function (property) { return typescript_1.factory.createStringLiteral(property.name); }));
    }
    else if (isFnCallExpression("typeInfo", node, typeChecker)) {
        if (!node.typeArguments) {
            return typescript_1.factory.createArrayLiteralExpression([]);
        }
        var multiLine = false;
        if (node.arguments.length) {
            multiLine = node.arguments[0].kind == typescript_1.default.SyntaxKind.TrueKeyword;
        }
        return getTypeInfo(node.typeArguments[0], typeChecker, multiLine);
    }
    return node;
};
var getTypeInfo = function (typeNode, typeChecker, multiLine) {
    var type = typeChecker.getTypeFromTypeNode(typeNode);
    var properties = [];
    var symbols = typeChecker.getPropertiesOfType(type);
    symbols.forEach(function (s) {
        if (!s.valueDeclaration)
            return;
        var prop = getPropertyInfo(s.valueDeclaration, typeChecker, multiLine);
        if (prop)
            properties.push(prop);
    });
    var infoObject = [];
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
            var type_1 = typeNode;
            infoObject.push(typescript_1.factory.createPropertyAssignment(typescript_1.factory.createStringLiteral("properties"), typescript_1.factory.createArrayLiteralExpression(type_1.members
                .map(function (m) { return getPropertyInfo(m, typeChecker, multiLine); })
                .filter(function (m) { return typeof m !== 'undefined'; }))));
        }
    }
    return typescript_1.factory.createObjectLiteralExpression(infoObject, multiLine);
};
var getPropertyInfo = function (decl, typeChecker, multiLine) {
    if (decl.kind != typescript_1.default.SyntaxKind.PropertyDeclaration && decl.kind != typescript_1.default.SyntaxKind.PropertySignature)
        return;
    var property = decl;
    var objectArray = [
        typescript_1.factory.createPropertyAssignment(typescript_1.factory.createStringLiteral("name"), typescript_1.factory.createStringLiteral(property.name.getText())),
        typescript_1.factory.createPropertyAssignment(typescript_1.factory.createStringLiteral("type"), getPropertyType(property.type))
    ];
    if (property.questionToken) {
        objectArray.push(typescript_1.factory.createPropertyAssignment(typescript_1.factory.createStringLiteral("optional"), typescript_1.factory.createTrue()));
    }
    if (property.type && property.type.kind == typescript_1.default.SyntaxKind.TypeLiteral) {
        var type = property.type;
        objectArray.push(typescript_1.factory.createPropertyAssignment(typescript_1.factory.createStringLiteral("properties"), typescript_1.factory.createArrayLiteralExpression(type.members
            .map(function (m) { return getPropertyInfo(m, typeChecker, multiLine); })
            .filter(function (m) { return typeof m !== 'undefined'; }))));
    }
    if (property.type && property.type.kind == typescript_1.default.SyntaxKind.TypeReference) {
        var type = property.type;
        if (type.typeArguments) {
            objectArray.push(typescript_1.factory.createPropertyAssignment(typescript_1.factory.createStringLiteral("typeArguments"), typescript_1.factory.createArrayLiteralExpression(type.typeArguments
                .map(function (t) { return getTypeInfo(t, typeChecker, multiLine); }))));
        }
    }
    return typescript_1.factory.createObjectLiteralExpression(objectArray, multiLine);
};
var getPropertyType = function (type) {
    if (typeof type.intrinsicName === 'string') {
        return typescript_1.factory.createStringLiteral(type.intrinsicName);
    }
    if (type.types || type.kind == typescript_1.default.SyntaxKind.UnionType || type.kind == typescript_1.default.SyntaxKind.IntersectionType) {
        return typescript_1.factory.createArrayLiteralExpression(type.types.map(function (token) { return getPropertyType(token); }));
    }
    var typeName = '';
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
var indexTs = path.join(__dirname, './index.ts');
var isFnCallExpression = function (name, node, typeChecker) {
    if (!typescript_1.default.isCallExpression(node)) {
        return false;
    }
    var signature = typeChecker.getResolvedSignature(node);
    if (typeof signature === 'undefined') {
        return false;
    }
    var declaration = signature.declaration;
    return !!declaration
        && !typescript_1.default.isJSDocSignature(declaration)
        && (path.join(declaration.getSourceFile().fileName) === indexTs)
        && !!declaration.name
        && declaration.name.getText() === name;
};
