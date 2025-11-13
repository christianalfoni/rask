// JSX dev runtime for TypeScript type checking in development mode
// The actual JSX transformation is done by SWC plugin at build time

export { jsx, jsxs, Fragment } from "./jsx-runtime";

// In development mode, TypeScript uses jsxDEV instead of jsx
export { jsx as jsxDEV } from "./jsx-runtime";
