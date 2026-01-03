#!/usr/bin/env node

/**
 * tsparser CLI
 *
 * Usage:
 *   npx tsparser -o output.ts
 *   echo '{"type":"factory",...}' | npx tsparser -o output.ts
 *   cat ast.json | npx tsparser -o output.ts
 *
 * Options:
 *   -o, --output <file>   Output file path (required)
 *   -h, --help            Show help
 *   --version             Show version
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { toTypeScriptFile } from './index.js';
import type { SerializedNode } from './types.js';

const VERSION = '1.0.0';

interface CliOptions {
    output?: string;
    help?: boolean;
    version?: boolean;
}

/**
 * Parse command line arguments.
 */
function parseCliArgs(): CliOptions {
    const { values } = parseArgs({
        options: {
            output: {
                type: 'string',
                short: 'o',
            },
            help: {
                type: 'boolean',
                short: 'h',
            },
            version: {
                type: 'boolean',
            },
        },
        allowPositionals: false,
    });

    return values;
}

/**
 * Print help message.
 */
function printHelp(): void {
    console.log(`
tsparser - TypeScript AST to code generator

Usage:
  tsparser -o <output-file>

Options:
  -o, --output <file>   Output file path (required)
  -h, --help            Show this help message
  --version             Show version number

Examples:
  # Generate TypeScript from JSON via stdin
  echo '[{"type":"factory","name":"createIdentifier",...}]' | tsparser -o out.ts

  # Pipe from Python
  python generate_ast.py | tsparser -o generated/types.ts

Input Format:
  JSON array of serialized AST nodes via stdin.
  Each node should follow the SerializedNode format from pyastts.
`);
}

/**
 * Read all data from stdin.
 */
async function readStdin(): Promise<string> {
    const chunks: Buffer[] = [];

    // Check if stdin is a TTY (interactive terminal)
    if (process.stdin.isTTY) {
        throw new Error(
            'No input provided. Pipe JSON data via stdin.\n' +
            'Example: echo \'[...]\' | tsparser -o output.ts'
        );
    }

    return new Promise((resolve, reject) => {
        process.stdin.on('data', (chunk) => {
            if (typeof chunk === 'string') {
                chunks.push(Buffer.from(chunk, 'utf-8'));
            } else {
                chunks.push(chunk);
            }
        });
        process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
        process.stdin.on('error', reject);
    });
}

/**
 * Ensure directory exists for the output file.
 */
function ensureDir(filePath: string): void {
    const dir = dirname(filePath);
    if (dir && dir !== '.') {
        mkdirSync(dir, { recursive: true });
    }
}

/**
 * Main CLI entry point.
 */
async function main(): Promise<void> {
    try {
        const options = parseCliArgs();

        if (options.version) {
            console.log(VERSION);
            process.exit(0);
        }

        if (options.help) {
            printHelp();
            process.exit(0);
        }

        if (!options.output) {
            console.error('Error: Output file is required. Use -o <file>');
            console.error('Run "tsparser --help" for usage information.');
            process.exit(1);
        }

        // Read JSON from stdin
        const input = await readStdin();

        if (!input.trim()) {
            console.error('Error: No input received from stdin.');
            process.exit(1);
        }

        // Parse JSON
        let nodes: SerializedNode[];
        try {
            const parsed = JSON.parse(input);
            // Handle both single node and array of nodes
            nodes = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
            console.error('Error: Invalid JSON input.');
            process.exit(1);
            return; // TypeScript needs this for control flow
        }

        // Generate TypeScript code
        const code = await toTypeScriptFile(nodes);

        // Write to output file
        const outputPath = resolve(process.cwd(), options.output);
        ensureDir(outputPath);
        writeFileSync(outputPath, code, 'utf-8');

        console.log(`Generated: ${outputPath}`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
        } else {
            console.error('An unknown error occurred.');
        }
        process.exit(1);
    }
}

main();
