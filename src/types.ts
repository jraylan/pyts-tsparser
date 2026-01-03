/**
 * Types for the serialized AST format from Python.
 *
 * These types mirror the serialization format defined in
 * pyastts/core/types.py
 */

/**
 * Represents a literal value (null, bool, string).
 */
export interface SerializedLiteral {
    type: 'literal';
    value: null | boolean | string;
}

/**
 * Represents a numeric value (int or float as string).
 */
export interface SerializedNumber {
    type: 'number';
    value: number | string;
}

/**
 * Represents a factory function call.
 */
export interface SerializedFactory {
    type: 'factory';
    name: string;
    args: SerializedNode[];
}

export interface SerializedUndefined {
    type: 'undefined';
}

/**
 * Union of all serialized node types.
 */
export type SerializedNode =
    | SerializedLiteral
    | SerializedNumber
    | SerializedFactory
    | SerializedUndefined;

/**
 * Type guard for SerializedLiteral.
 */
export function isLiteral(node: SerializedNode): node is SerializedLiteral {
    return node.type === 'literal';
}

/**
 * Type guard for SerializedLiteral representing undefined.
 */
export function isUndefined(node: SerializedNode): node is SerializedUndefined {
    return node.type === 'undefined';
}

/**
 * Type guard for SerializedNumber.
 */
export function isNumber(node: SerializedNode): node is SerializedNumber {
    return node.type === 'number';
}

/**
 * Type guard for SerializedFactory.
 */
export function isFactory(node: SerializedNode): node is SerializedFactory {
    return node.type === 'factory';
}
