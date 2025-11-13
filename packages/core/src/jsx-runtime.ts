// JSX runtime for TypeScript type checking
// The actual JSX transformation is done by SWC plugin at build time
// This file only provides type declarations for TypeScript's "jsx": "react-jsx" mode

// Import inferno to get the global JSX namespace
import 'inferno';

// Re-export Fragment for JSX fragment syntax
export { Fragment } from 'inferno';

// Type declarations for jsx/jsxs functions (never called at runtime)
// TypeScript uses these signatures for JSX type checking
export declare function jsx(type: any, props: any, key?: any): any;
export declare function jsxs(type: any, props: any, key?: any): any;
