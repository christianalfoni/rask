// JSX dev runtime - adds jsxDEV for development mode
export { jsx, jsxs, Fragment, FragmentSymbol } from './jsx-runtime';
export type { JSX } from './jsx-runtime';

// In development mode, TypeScript uses jsxDEV instead of jsx
// We just alias it to jsx since we don't need the extra dev-mode params
export { jsx as jsxDEV } from './jsx-runtime';
