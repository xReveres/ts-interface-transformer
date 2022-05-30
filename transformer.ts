import * as path from 'path';
import ts, { factory } from 'typescript';

export default (program: ts.Program): ts.TransformerFactory<ts.SourceFile> => {
    return (ctx: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile): ts.SourceFile => {
            const visitor = (node: ts.Node): ts.Node => {
                return ts.visitEachChild(visitNode(node, program), visitor, ctx);
            };
            return <ts.SourceFile>ts.visitEachChild(visitNode(sourceFile, program), visitor, ctx);
        };
    };
}

const symbolMap = new Map<string, ts.Symbol>();
type PropertyInfo = ts.PropertyDeclaration | ts.PropertySignature;

const visitNode = (node: ts.Node, program: ts.Program): ts.Node => {
    if (node.kind === ts.SyntaxKind.SourceFile) {
        node['locals'].forEach((symbol: ts.Symbol, key: string) => {
            if (!symbolMap.has(key)) {
                symbolMap.set(key, symbol);
            }
        });
    }
    const typeChecker = program.getTypeChecker();
    if (isFnCallExpression("keys", node, typeChecker)) {
        if (!node.typeArguments) {
            return factory.createArrayLiteralExpression([]);
        }
        const type = typeChecker.getTypeFromTypeNode(node.typeArguments[0]);
        const properties = typeChecker.getPropertiesOfType(type);
        return factory.createArrayLiteralExpression(properties.map(property => factory.createStringLiteral(property.name)));
    } else if (isFnCallExpression("typeInfo", node, typeChecker)) {
        if (!node.typeArguments) {
            return factory.createArrayLiteralExpression([]);
        }
        let multiLine = false;
        if (node.arguments.length) {
            multiLine = node.arguments[0].kind == ts.SyntaxKind.TrueKeyword;
        }
        return getTypeInfo(node.typeArguments[0], typeChecker, multiLine);
    }

    return node;
};

const getTypeInfo = (typeNode: ts.TypeNode, typeChecker: ts.TypeChecker, multiLine: boolean) => {
    const type = typeChecker.getTypeFromTypeNode(typeNode);
    let properties: ts.Expression[] = [];
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
            infoObject.push(factory.createPropertyAssignment(
                factory.createStringLiteral("name"),
                factory.createStringLiteral(type.symbol.getName())
            ));
        }
        infoObject.push(factory.createPropertyAssignment(
            factory.createStringLiteral("type"),
            getPropertyType(type)
        ));
        infoObject.push(factory.createPropertyAssignment(
            factory.createStringLiteral("properties"),
            factory.createArrayLiteralExpression(properties)
        ));
    } else {
        infoObject.push(factory.createPropertyAssignment(
            factory.createStringLiteral("type"),
            getPropertyType(typeNode)
        ));
        if (typeNode.kind == ts.SyntaxKind.TypeLiteral) {
            const type = typeNode as ts.TypeLiteralNode;
            infoObject.push(factory.createPropertyAssignment(
                factory.createStringLiteral("properties"),
                factory.createArrayLiteralExpression(type.members
                    .map(m => getPropertyInfo(m, typeChecker, multiLine))
                    .filter(m => typeof m !== 'undefined') as ts.Expression[])
            ));
        }
    }
    return factory.createObjectLiteralExpression(infoObject, multiLine);
}

const getPropertyInfo = (decl: ts.Declaration, typeChecker: ts.TypeChecker, multiLine: boolean): ts.Expression | undefined => {
    if (decl.kind != ts.SyntaxKind.PropertyDeclaration && decl.kind != ts.SyntaxKind.PropertySignature)
        return;
    const property = decl as PropertyInfo;
    const objectArray = [
        factory.createPropertyAssignment(
            factory.createStringLiteral("name"),
            factory.createStringLiteral(property.name.getText())
        ),
        factory.createPropertyAssignment(
            factory.createStringLiteral("type"),
            getPropertyType(property.type)
        )
    ];
    if (property.questionToken) {
        objectArray.push(factory.createPropertyAssignment(
            factory.createStringLiteral("optional"),
            factory.createTrue()
        ));
    }
    if (property.type && property.type.kind == ts.SyntaxKind.TypeLiteral) {
        const type = property.type as ts.TypeLiteralNode;
        objectArray.push(factory.createPropertyAssignment(
            factory.createStringLiteral("properties"),
            factory.createArrayLiteralExpression(type.members
                .map(m => getPropertyInfo(m, typeChecker, multiLine))
                .filter(m => typeof m !== 'undefined') as ts.Expression[])
        ));
    }
    if (property.type && property.type.kind == ts.SyntaxKind.TypeReference) {
        const type = property.type as ts.TypeReferenceNode;
        if (type.typeArguments) {
            objectArray.push(factory.createPropertyAssignment(
                factory.createStringLiteral("typeArguments"),
                factory.createArrayLiteralExpression(type.typeArguments
                    .map(t => getTypeInfo(t, typeChecker, multiLine)))
            ));
        }
    }
    if (property.type && property.type.kind == ts.SyntaxKind.ArrayType) {
        const type = property.type as ts.ArrayTypeNode;
        objectArray.push(factory.createPropertyAssignment(
            factory.createStringLiteral("elementType"),
            getTypeInfo(type.elementType, typeChecker, multiLine)
        ));
    }
    return factory.createObjectLiteralExpression(objectArray, multiLine);
}

const getPropertyType = (type: any): ts.StringLiteral | ts.ArrayLiteralExpression => {
    if (typeof type.intrinsicName === 'string') {
        return factory.createStringLiteral(type.intrinsicName);
    }
    if (type.types || type.kind == ts.SyntaxKind.UnionType || type.kind == ts.SyntaxKind.IntersectionType) {
        return factory.createArrayLiteralExpression(type.types.map((token: any) => getPropertyType(token)));
    }
    if (type.kind == ts.SyntaxKind.ParenthesizedType) {
        return getPropertyType(type.type);
    }
    let typeName: string = '';
    switch (type.kind) {
        case ts.SyntaxKind.UndefinedKeyword:
            typeName = 'undefined';
            break;
        case ts.SyntaxKind.ArrayType:
            typeName = 'array';
            break;
        case ts.SyntaxKind.StringKeyword:
            typeName = 'string';
            break;
        case ts.SyntaxKind.NumberKeyword:
            typeName = 'number';
            break;
        case ts.SyntaxKind.BigIntKeyword:
            typeName = 'bigint';
            break;
        case ts.SyntaxKind.BooleanKeyword:
            typeName = 'boolean';
            break;
        case ts.SyntaxKind.FunctionType:
            typeName = 'Function';
            break;
        case ts.SyntaxKind.TypeReference:
            typeName = type.typeName.escapedText;
            break;
        case ts.SyntaxKind.AnyKeyword:
            typeName = 'any';
            break;
        case ts.SyntaxKind.NullKeyword:
            typeName = 'null';
            break;
        case ts.SyntaxKind.ObjectKeyword:
            typeName = 'object';
            break;
        case ts.SyntaxKind.TypeLiteral:
            typeName = 'object';
            break;
        default:
            if (typeof type.isClass === 'function' && typeof type.isClassOrInterface === 'function' && type.isClassOrInterface())
                typeName = type.isClass() ? 'class' : 'interface';
            else
                typeName = 'unknown';
    }
    return factory.createStringLiteral(typeName);
};

const indexTs = path.join(__dirname, './index.ts');
const isFnCallExpression = (name: string, node: ts.Node, typeChecker: ts.TypeChecker): node is ts.CallExpression => {
    if (!ts.isCallExpression(node)) {
        return false;
    }
    const signature = typeChecker.getResolvedSignature(node);
    if (typeof signature === 'undefined') {
        return false;
    }
    const { declaration } = signature;
    return !!declaration
        && !ts.isJSDocSignature(declaration)
        && (path.join(declaration.getSourceFile().fileName) === indexTs)
        && !!declaration.name
        && declaration.name.getText() === name;
};