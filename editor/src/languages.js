/**
 * Languages module - Maps file extensions to CodeMirror 6 language support
 * Part of PocketIDE CodeMirror 6 Editor
 */

import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';

/**
 * Language registry - maps file extensions to language configs
 * @type {Object<string, {name: string, extensions: Function, mime: string}>}
 */
const languageRegistry = {
  js:     { name: 'JavaScript',  ext: () => javascript(),  mime: 'text/javascript' },
  jsx:    { name: 'JSX',         ext: () => javascript({ jsx: true }), mime: 'text/jsx' },
  ts:     { name: 'TypeScript',  ext: () => javascript({ typescript: true }), mime: 'application/typescript' },
  tsx:    { name: 'TSX',         ext: () => javascript({ typescript: true, jsx: true }), mime: 'text/tsx' },
  py:     { name: 'Python',      ext: () => python(),     mime: 'text/x-python' },
  html:   { name: 'HTML',        ext: () => html(),       mime: 'text/html' },
  htm:    { name: 'HTML',        ext: () => html(),       mime: 'text/html' },
  css:    { name: 'CSS',         ext: () => css(),        mime: 'text/css' },
  json:   { name: 'JSON',        ext: () => json(),       mime: 'application/json' },
  md:     { name: 'Markdown',    ext: () => markdown(),   mime: 'text/markdown' },
  mdown:  { name: 'Markdown',    ext: () => markdown(),   mime: 'text/markdown' },
  markdown: { name: 'Markdown',  ext: () => markdown(),   mime: 'text/markdown' },
  mjs:    { name: 'JavaScript',  ext: () => javascript(), mime: 'text/javascript' },
  cjs:    { name: 'JavaScript',  ext: () => javascript(), mime: 'text/javascript' },
  mts:    { name: 'TypeScript',  ext: () => javascript({ typescript: true }), mime: 'application/typescript' },
  cts:    { name: 'TypeScript',  ext: () => javascript({ typescript: true }), mime: 'application/typescript' },
};

/**
 * Detect language from filename
 * @param {string} filename
 * @returns {{name: string, ext: Function}}
 */
export function detectLanguage(filename) {
  if (!filename) return { name: 'Plain Text', ext: null };
  const ext = filename.split('.').pop().toLowerCase();
  return languageRegistry[ext] || { name: 'Plain Text', ext: null };
}

/**
 * Register a custom language
 * @param {string} extension - File extension without dot (e.g. 'rs')
 * @param {{name: string, ext: Function, mime?: string}} config
 */
export function registerLanguage(extension, config) {
  languageRegistry[extension.toLowerCase()] = config;
}

/**
 * Get all registered language names
 * @returns {string[]}
 */
export function getLanguageNames() {
  const names = new Set();
  Object.values(languageRegistry).forEach(l => names.add(l.name));
  return Array.from(names);
}

/**
 * Create a CodeMirror 6 extension for a given filename
 * @param {string} filename
 * @returns {import('@codemirror/state').Extension|null}
 */
export function createLanguageExtension(filename) {
  const lang = detectLanguage(filename);
  return lang.ext ? lang.ext() : null;
}
