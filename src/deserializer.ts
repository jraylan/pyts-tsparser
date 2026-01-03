/**
 * Deserializer for converting JSON AST to TypeScript ts.factory calls.
 *
 * This module implements the Strategy pattern to handle different
 * serialized node types and convert them to actual TypeScript AST nodes.
 */

import ts from 'typescript';
import {
    SerializedNode,
    SerializedFactory,
    isLiteral,
    isUndefined,
    isNumber,
    isFactory,
} from './types.js';

/**
 * Factory function type for ts.factory methods.
 * Using 'any' for maximum compatibility with diverse factory signatures.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FactoryFunction = (...args: any[]) => ts.Node;

/**
 * Maps factory names to their ts.factory implementations.
 */
const factoryMap: Record<string, FactoryFunction> = {
    // Generic token creation
    createToken: ts.factory.createToken as FactoryFunction,

    // Common
    createIdentifier: ts.factory.createIdentifier as FactoryFunction,
    createPrivateIdentifier: ts.factory.createPrivateIdentifier as FactoryFunction,
    createQualifiedName: ts.factory.createQualifiedName as FactoryFunction,

    // Literals
    createStringLiteral: ts.factory.createStringLiteral as FactoryFunction,
    createNumericLiteral: ts.factory.createNumericLiteral as FactoryFunction,
    createBigIntLiteral: ts.factory.createBigIntLiteral as FactoryFunction,
    createRegularExpressionLiteral:
        ts.factory.createRegularExpressionLiteral as FactoryFunction,
    createNoSubstitutionTemplateLiteral:
        ts.factory.createNoSubstitutionTemplateLiteral as FactoryFunction,
    createTrue: ts.factory.createTrue,
    createFalse: ts.factory.createFalse,
    createNull: ts.factory.createNull,

    // Expressions
    createArrayLiteralExpression:
        ts.factory.createArrayLiteralExpression as FactoryFunction,
    createObjectLiteralExpression:
        ts.factory.createObjectLiteralExpression as FactoryFunction,
    createPropertyAccessExpression:
        ts.factory.createPropertyAccessExpression as FactoryFunction,
    createElementAccessExpression:
        ts.factory.createElementAccessExpression as FactoryFunction,
    createCallExpression: ts.factory.createCallExpression as FactoryFunction,
    createNewExpression: ts.factory.createNewExpression as FactoryFunction,
    createTaggedTemplateExpression:
        ts.factory.createTaggedTemplateExpression as FactoryFunction,
    createTypeAssertion: ts.factory.createTypeAssertion as FactoryFunction,
    createParenthesizedExpression:
        ts.factory.createParenthesizedExpression as FactoryFunction,
    createFunctionExpression:
        ts.factory.createFunctionExpression as FactoryFunction,
    createArrowFunction: ts.factory.createArrowFunction as FactoryFunction,
    createDeleteExpression: ts.factory.createDeleteExpression as FactoryFunction,
    createTypeOfExpression: ts.factory.createTypeOfExpression as FactoryFunction,
    createVoidExpression: ts.factory.createVoidExpression as FactoryFunction,
    createAwaitExpression: ts.factory.createAwaitExpression as FactoryFunction,
    createPrefixUnaryExpression:
        ts.factory.createPrefixUnaryExpression as FactoryFunction,
    createPostfixUnaryExpression:
        ts.factory.createPostfixUnaryExpression as FactoryFunction,
    createBinaryExpression: ts.factory.createBinaryExpression as FactoryFunction,
    createConditionalExpression:
        ts.factory.createConditionalExpression as FactoryFunction,
    createTemplateExpression:
        ts.factory.createTemplateExpression as FactoryFunction,
    createYieldExpression: ts.factory.createYieldExpression as FactoryFunction,
    createSpreadElement: ts.factory.createSpreadElement as FactoryFunction,
    createClassExpression: ts.factory.createClassExpression as FactoryFunction,
    createOmittedExpression: ts.factory.createOmittedExpression,
    createAsExpression: ts.factory.createAsExpression as FactoryFunction,
    createNonNullExpression: ts.factory.createNonNullExpression as FactoryFunction,
    createSatisfiesExpression:
        ts.factory.createSatisfiesExpression as FactoryFunction,

    // Statements
    createBlock: ts.factory.createBlock as FactoryFunction,
    createEmptyStatement: ts.factory.createEmptyStatement,
    createVariableStatement: ts.factory.createVariableStatement as FactoryFunction,
    createExpressionStatement:
        ts.factory.createExpressionStatement as FactoryFunction,
    createIfStatement: ts.factory.createIfStatement as FactoryFunction,
    createDoStatement: ts.factory.createDoStatement as FactoryFunction,
    createWhileStatement: ts.factory.createWhileStatement as FactoryFunction,
    createForStatement: ts.factory.createForStatement as FactoryFunction,
    createForInStatement: ts.factory.createForInStatement as FactoryFunction,
    createForOfStatement: ts.factory.createForOfStatement as FactoryFunction,
    createContinueStatement: ts.factory.createContinueStatement as FactoryFunction,
    createBreakStatement: ts.factory.createBreakStatement as FactoryFunction,
    createReturnStatement: ts.factory.createReturnStatement as FactoryFunction,
    createWithStatement: ts.factory.createWithStatement as FactoryFunction,
    createSwitchStatement: ts.factory.createSwitchStatement as FactoryFunction,
    createLabeledStatement: ts.factory.createLabeledStatement as FactoryFunction,
    createThrowStatement: ts.factory.createThrowStatement as FactoryFunction,
    createTryStatement: ts.factory.createTryStatement as FactoryFunction,
    createDebuggerStatement: ts.factory.createDebuggerStatement,

    // Declarations
    createVariableDeclaration:
        ts.factory.createVariableDeclaration as FactoryFunction,
    createVariableDeclarationList:
        ts.factory.createVariableDeclarationList as FactoryFunction,
    createFunctionDeclaration:
        ts.factory.createFunctionDeclaration as FactoryFunction,
    createClassDeclaration: ts.factory.createClassDeclaration as FactoryFunction,
    createInterfaceDeclaration:
        ts.factory.createInterfaceDeclaration as FactoryFunction,
    createTypeAliasDeclaration:
        ts.factory.createTypeAliasDeclaration as FactoryFunction,
    createEnumDeclaration: ts.factory.createEnumDeclaration as FactoryFunction,
    createModuleDeclaration: ts.factory.createModuleDeclaration as FactoryFunction,

    // Import/Export
    createImportDeclaration:
        ts.factory.createImportDeclaration as FactoryFunction,
    createImportClause: ts.factory.createImportClause as FactoryFunction,
    createNamespaceImport: ts.factory.createNamespaceImport as FactoryFunction,
    createNamedImports: ts.factory.createNamedImports as FactoryFunction,
    createImportSpecifier: ts.factory.createImportSpecifier as FactoryFunction,
    createExportAssignment: ts.factory.createExportAssignment as FactoryFunction,
    createExportDeclaration: ts.factory.createExportDeclaration as FactoryFunction,
    createNamedExports: ts.factory.createNamedExports as FactoryFunction,
    createExportSpecifier: ts.factory.createExportSpecifier as FactoryFunction,

    // Type Nodes
    createTypeReferenceNode:
        ts.factory.createTypeReferenceNode as FactoryFunction,
    createTypeQueryNode: ts.factory.createTypeQueryNode as FactoryFunction,
    createArrayTypeNode: ts.factory.createArrayTypeNode as FactoryFunction,
    createTupleTypeNode: ts.factory.createTupleTypeNode as FactoryFunction,
    createUnionTypeNode: ts.factory.createUnionTypeNode as FactoryFunction,
    createIntersectionTypeNode:
        ts.factory.createIntersectionTypeNode as FactoryFunction,
    createLiteralTypeNode: ts.factory.createLiteralTypeNode as FactoryFunction,
    createFunctionTypeNode: ts.factory.createFunctionTypeNode as FactoryFunction,
    createTypeLiteralNode: ts.factory.createTypeLiteralNode as FactoryFunction,
    createTypeOperatorNode: ts.factory.createTypeOperatorNode as FactoryFunction,
    createIndexedAccessTypeNode:
        ts.factory.createIndexedAccessTypeNode as FactoryFunction,
    createPropertySignature:
        ts.factory.createPropertySignature as FactoryFunction,

    // Class Elements
    createPropertyDeclaration:
        ts.factory.createPropertyDeclaration as FactoryFunction,
    createMethodDeclaration:
        ts.factory.createMethodDeclaration as FactoryFunction,
    createConstructorDeclaration:
        ts.factory.createConstructorDeclaration as FactoryFunction,
    createGetAccessorDeclaration:
        ts.factory.createGetAccessorDeclaration as FactoryFunction,
    createSetAccessorDeclaration:
        ts.factory.createSetAccessorDeclaration as FactoryFunction,
    createIndexSignature: ts.factory.createIndexSignature as FactoryFunction,
    createClassStaticBlockDeclaration:
        ts.factory.createClassStaticBlockDeclaration as FactoryFunction,

    // Object Elements
    createPropertyAssignment:
        ts.factory.createPropertyAssignment as FactoryFunction,
    createShorthandPropertyAssignment:
        ts.factory.createShorthandPropertyAssignment as FactoryFunction,
    createSpreadAssignment: ts.factory.createSpreadAssignment as FactoryFunction,

    // Bindings
    createObjectBindingPattern:
        ts.factory.createObjectBindingPattern as FactoryFunction,
    createArrayBindingPattern:
        ts.factory.createArrayBindingPattern as FactoryFunction,
    createBindingElement: ts.factory.createBindingElement as FactoryFunction,

    // Misc
    createParameterDeclaration:
        ts.factory.createParameterDeclaration as FactoryFunction,
    createTypeParameterDeclaration:
        ts.factory.createTypeParameterDeclaration as FactoryFunction,
    createDecorator: ts.factory.createDecorator as FactoryFunction,
    createHeritageClause: ts.factory.createHeritageClause as FactoryFunction,
    createExpressionWithTypeArguments:
        ts.factory.createExpressionWithTypeArguments as FactoryFunction,
    createCatchClause: ts.factory.createCatchClause as FactoryFunction,
    createCaseClause: ts.factory.createCaseClause as FactoryFunction,
    createDefaultClause: ts.factory.createDefaultClause as FactoryFunction,
    createCaseBlock: ts.factory.createCaseBlock as FactoryFunction,
    createTemplateHead: ts.factory.createTemplateHead as FactoryFunction,
    createTemplateMiddle: ts.factory.createTemplateMiddle as FactoryFunction,
    createTemplateTail: ts.factory.createTemplateTail as FactoryFunction,
    createTemplateSpan: ts.factory.createTemplateSpan as FactoryFunction,

    // Keywords
    createKeywordTypeNode: ts.factory.createKeywordTypeNode as FactoryFunction,
};

type DeserializedValues = string | number | boolean | ts.Node | null | undefined | DeserializedValues[];

/**
 * Deserializes a serialized node to a TypeScript AST node or value.
 *
 * Note: null values are converted to undefined for TypeScript compatibility,
 * as many ts.factory methods expect undefined for optional parameters.
 */
export function deserialize(node: SerializedNode): DeserializedValues {
    if (isLiteral(node)) {
        return node.value
    }

    if (isUndefined(node)) {
        return undefined;
    }

    if (isNumber(node)) {
        const value = node.value;
        return typeof value === 'string' ? parseFloat(value) : value;
    }

    if (isFactory(node)) {
        return deserializeFactory(node);
    }

    throw new Error(`Unknown node type: ${(node as SerializedNode).type}`);
}

/**
 * Deserializes a factory call to a TypeScript AST node.
 */
function deserializeFactory(node: SerializedFactory): DeserializedValues {
    // Handle special __array__ pseudo-factory
    if (node.name === '__array__') {
        return node.args.map(deserialize);
    }

    const factory = factoryMap[node.name];
    if (!factory) {
        throw new Error(`Unknown factory method: ${node.name}`);
    }

    const args = node.args.map(deserialize);
    return factory(...args);
}

/**
 * Deserializes a serialized node to a TypeScript Statement.
 */
export function deserializeStatement(node: SerializedNode): ts.Statement {
    const result = deserialize(node);
    if (!ts.isStatement(result as ts.Node)) {
        throw new Error(`Expected a statement, got: ${(result as ts.Node).kind}`);
    }
    return result as ts.Statement;
}

/**
 * Deserializes an array of serialized nodes to TypeScript Statements.
 */
export function deserializeStatements(
    nodes: SerializedNode[]
): ts.Statement[] {
    return nodes.map(deserializeStatement);
}

/**
 * Deserializes a serialized node to a TypeScript Expression.
 */
export function deserializeExpression(node: SerializedNode): ts.Expression {
    const result = deserialize(node);
    if (!ts.isExpression(result as ts.Node)) {
        throw new Error(`Expected an expression, got: ${(result as ts.Node).kind}`);
    }
    return result as ts.Expression;
}

/**
 * Deserializes a serialized node to a TypeScript Declaration.
 */
export function deserializeDeclaration(
    node: SerializedNode
): ts.DeclarationStatement {
    const result = deserialize(node);
    return result as ts.DeclarationStatement;
}
