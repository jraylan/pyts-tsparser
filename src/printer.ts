/**
 * Printer for converting TypeScript AST nodes to source code.
 *
 * This module provides functions to print TypeScript AST nodes
 * as formatted source code strings.
 */

import ts from 'typescript';
import eslint from 'eslint';
import jsPlugin from '@eslint/js';
import { defineConfig } from 'eslint/config';
import typescriptPlugin from "typescript-eslint";

/**
 * Printer options for customizing output format.
 */
export interface PrinterOptions {
    /**
     * Whether to use single quotes for strings.
     * @default false
     */
    singleQuote?: boolean;

    /**
     * Whether to add a newline at the end of the output.
     * @default true
     */
    trailingNewline?: boolean;

    /**
     * The indentation width (number of spaces).
     * @default 2
     */
    indentWidth?: number;

    /**
     * Whether to remove comments from output.
     * @default false
     */
    removeComments?: boolean;
}




function createLinter(options: PrinterOptions): eslint.ESLint {
    return new eslint.ESLint({
        baseConfig: {
            plugins: {
                js: jsPlugin,
                typescript: typescriptPlugin,
            }
        },
        overrideConfig: [
            jsPlugin.configs.recommended,
            ...typescriptPlugin.configs.strict,
            ...typescriptPlugin.configs.stylistic,
            ...defineConfig([
                {
                    rules: {
                        "indent": ["error", options.indentWidth ?? 2],
                        "quotes": ["error", options.singleQuote ? "single" : "double"],
                        "eol-last": ["error", options.trailingNewline === false ? "never" : "always"],
                        "@typescript-eslint/prefer-as-const": ["error"]
                    }
                }
            ])
        ],
        overrideConfigFile: true,
        fix: true,
    })
}


async function lintText(text: string, options: PrinterOptions) {
    const linter = createLinter(options)
    const result = await linter.lintText(text, { filePath: 'output.ts' })

    // If there's output, use it (this means fixes were applied)
    if (result?.[0]?.output !== undefined) {
        return result[0].output;
    }

    // If no errors, the input is already valid - return as-is
    if (!result?.[0]?.messages?.length) {
        return text;
    }

    // There were errors that couldn't be fixed
    const messages = result[0].messages
        .map(m => `${m.line}:${m.column} ${m.message}`)
        .join('\n');
    throw new Error(
        `unable to lint printed node:\n\n${text}\n\nErrors:\n${messages}`
    );
}



/**
 * Creates a TypeScript Printer with the given options.
 */
function createPrinter(options: PrinterOptions = {}): ts.Printer {
    return ts.createPrinter({
        newLine: ts.NewLineKind.LineFeed,
        removeComments: options.removeComments ?? false,
    });
}

/**
 * Creates a minimal source file for printing purposes.
 */
function createSourceFile(content = ''): ts.SourceFile {
    return ts.createSourceFile(
        'output.ts',
        content,
        ts.ScriptTarget.Latest,
        false,
        ts.ScriptKind.TS
    );
}

/**
 * Prints a single TypeScript node to a string.
 */
export async function printNode(
    node: ts.Node,
    options: PrinterOptions = {}
): Promise<string> {
    const printer = createPrinter(options);
    const sourceFile = createSourceFile();

    let text = printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
    if (!text) {
        return ""
    }

    return await lintText(text, options);
}

/**
 * Prints multiple TypeScript nodes to a string.
 */
export async function printNodes(
    nodes: ts.Node[],
    options: PrinterOptions = {}
): Promise<string> {
    const printer = createPrinter(options);
    const sourceFile = createSourceFile();

    const parts = nodes.map((node) =>
        printer.printNode(ts.EmitHint.Unspecified, node, sourceFile)
    );

    let text = parts.join('\n');

    if (!text) {
        return ""
    }

    return await lintText(text, options);
}

/**
 * Prints a list of statements as a complete TypeScript file.
 */
export async function printFile(
    statements: ts.Statement[],
    options: PrinterOptions = {}
): Promise<string> {
    const printer = createPrinter(options);

    // Create a source file with the statements
    const sourceFile = ts.factory.createSourceFile(
        statements,
        ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
        ts.NodeFlags.None
    );

    let text = printer.printFile(sourceFile);

    if (!text) {
        return ""
    }

    return await lintText(text, options);
}

/**
 * Prints a node list (e.g., for array literals).
 */
export async function printNodeList<T extends ts.Node>(
    nodes: readonly T[],
    options: PrinterOptions = {}
): Promise<string> {
    const printer = createPrinter(options);
    const sourceFile = createSourceFile();

    const list = ts.factory.createNodeArray(nodes);
    const text = printer.printList(
        ts.ListFormat.MultiLine,
        list,
        sourceFile
    );

    return await lintText(text, options);
}
