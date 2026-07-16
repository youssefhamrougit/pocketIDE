/**
 * Themes module - Dark/Light theme switching and management
 * Part of PocketIDE CodeMirror 6 Editor
 */

import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';

/**
 * Light theme configuration for CodeMirror 6
 */
const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: '#ffffff',
    color: '#213547',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-cursor': {
    borderLeftColor: '#213547',
  },
  '.cm-selectionBackground, ::selection': {
    backgroundColor: '#d4d4d4',
  },
  '.cm-activeLine': {
    backgroundColor: '#f0f0f0',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#e8e8e8',
  },
  '.cm-gutters': {
    backgroundColor: '#f5f5f5',
    color: '#999',
    border: 'none',
  },
  '.cm-lineNumbers .cm-activeLineGutter': {
    color: '#213547',
  },
  '.cm-foldPlaceholder': {
    backgroundColor: '#eee',
    color: '#666',
  },
  '.cm-matchingBracket': {
    backgroundColor: '#e0e0e0',
    outline: '1px solid #999',
  },
  '.cm-nonmatchingBracket': {
    backgroundColor: '#ffd7d7',
  },
  '.cm-tooltip': {
    backgroundColor: '#ffffff',
    border: '1px solid #ddd',
    color: '#213547',
  },
  '.cm-panel': {
    backgroundColor: '#f5f5f5',
  },
  '.cm-searchMatch': {
    backgroundColor: '#ffffb3',
    outline: '1px solid #ddd',
  },
  '.cm-searchMatch-selected': {
    backgroundColor: '#ffd700',
  },
}, { dark: false });

/**
 * Available editor themes
 */
const editorThemes = {
  dark: oneDark,
  light: lightTheme,
};

/**
 * CSS variable overrides for theme switching
 */
const themeVariables = {
  dark: {
    '--bg-primary': '#1e1e1e',
    '--bg-secondary': '#252526',
    '--bg-tertiary': '#2d2d2d',
    '--bg-hover': '#3c3c3c',
    '--bg-active': '#37373d',
    '--text-primary': '#cccccc',
    '--text-secondary': '#969696',
    '--text-muted': '#6a6a6a',
    '--border-color': '#3c3c3c',
    '--accent-color': '#007acc',
    '--accent-hover': '#1a8ad4',
    '--tab-active-bg': '#1e1e1e',
    '--tab-inactive-bg': '#2d2d2d',
    '--tab-border': '#252526',
    '--scrollbar-bg': '#1e1e1e',
    '--scrollbar-thumb': '#424242',
    '--status-bg': '#007acc',
    '--status-text': '#ffffff',
    '--sidebar-width': '260px',
    '--icon-filter': 'none',
  },
  light: {
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f3f3f3',
    '--bg-tertiary': '#ececec',
    '--bg-hover': '#e8e8e8',
    '--bg-active': '#dcdcdc',
    '--text-primary': '#333333',
    '--text-secondary': '#666666',
    '--text-muted': '#999999',
    '--border-color': '#e0e0e0',
    '--accent-color': '#0066b8',
    '--accent-hover': '#005a9e',
    '--tab-active-bg': '#ffffff',
    '--tab-inactive-bg': '#ececec',
    '--tab-border': '#e0e0e0',
    '--scrollbar-bg': '#f3f3f3',
    '--scrollbar-thumb': '#c1c1c1',
    '--status-bg': '#0066b8',
    '--status-text': '#ffffff',
    '--sidebar-width': '260px',
    '--icon-filter': 'invert(0.5)',
  },
};

let currentTheme = 'dark';

/**
 * Get the current CodeMirror theme extension
 * @returns {import('@codemirror/state').Extension}
 */
export function getThemeExtension() {
  return editorThemes[currentTheme] || editorThemes.dark;
}

/**
 * Apply theme to the document
 * @param {string} themeName - 'dark' or 'light'
 */
export function applyTheme(themeName) {
  currentTheme = themeName === 'light' ? 'light' : 'dark';
  const vars = themeVariables[currentTheme];

  // Apply CSS variables
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Set data attribute for CSS selectors
  root.setAttribute('data-theme', currentTheme);

  // Update theme toggle button
  const btn = document.getElementById('btn-theme-toggle');
  if (btn) {
    btn.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
    btn.title = currentTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme';
  }
}

/**
 * Toggle between dark and light themes
 * @returns {string} The new theme name
 */
export function toggleTheme() {
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  return newTheme;
}

/**
 * Get current theme name
 * @returns {string}
 */
export function getCurrentTheme() {
  return currentTheme;
}

/**
 * Register a custom CodeMirror theme
 * @param {string} name - Theme name
 * @param {import('@codemirror/state').Extension} extension - CodeMirror theme extension
 */
export function registerTheme(name, extension) {
  editorThemes[name] = extension;
}
