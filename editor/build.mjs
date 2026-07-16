import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, 'src');
const distDir = join(__dirname, 'dist');

const watch = process.argv.includes('--watch');

async function build() {
  // Build the JS bundle
  const result = await esbuild.build({
    entryPoints: [join(srcDir, 'editor.js')],
    bundle: true,
    format: 'iife',
    globalName: 'PocketIDE',
    minify: true,
    outfile: join(distDir, 'editor.bundle.js'),
    sourcemap: false,
    platform: 'browser',
    target: ['es2020'],
    loader: {
      '.js': 'jsx',
    },
  });

  // Read the HTML template and inject the bundle
  let html = readFileSync(join(srcDir, 'index.html'), 'utf-8');
  const bundle = readFileSync(join(distDir, 'editor.bundle.js'), 'utf-8');

  // Reference the JS bundle via src attribute (avoids </script> escaping issues)
  // The bundle file is already written to dist/ by esbuild
  html = html.replace(
    '<!-- INJECT:EDITOR_SCRIPT -->',
    '<script src="editor.bundle.js"></script>'
  );

  // Read and inline CSS
  const css = readFileSync(join(srcDir, 'styles.css'), 'utf-8');
  html = html.replace(
    '<!-- INJECT:EDITOR_STYLES -->',
    `<style>${css}</style>`
  );

  // Write the final HTML file
  if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });
  writeFileSync(join(distDir, 'index.html'), html, 'utf-8');

  console.log('✅ Editor built:', join(distDir, 'index.html'));
  console.log(`   Bundle size: ${Buffer.byteLength(bundle, 'utf-8')} bytes`);

  if (watch) {
    console.log('👀 Watching for changes...');
  }
}

if (watch) {
  // Watch mode
  const ctx = await esbuild.context({
    entryPoints: [join(srcDir, 'editor.js')],
    bundle: true,
    format: 'iife',
    globalName: 'PocketIDE',
    minify: true,
    outfile: join(distDir, 'editor.bundle.js'),
    sourcemap: false,
    platform: 'browser',
    target: ['es2020'],
  });
  await ctx.watch();
  console.log('👀 Watching for changes...');
  
  // Rebuild HTML on source changes
  // (Simplified: just rebuild on each watch cycle)
}

build();
