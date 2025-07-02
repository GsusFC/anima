const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const watch = process.argv.includes('--watch');

// Ensure build directory exists
if (!fs.existsSync('build')) {
  fs.mkdirSync('build');
}

// Build UI first, then create complete HTML
const buildComplete = async () => {
  console.log('Building UI bundle...');
  
  // Build UI bundle
  const uiResult = await esbuild.build({
    entryPoints: ['src/ui/index.tsx'],
    bundle: true,
    platform: 'browser',
    write: false,
    loader: {
      '.png': 'dataurl',
      '.svg': 'dataurl',
      '.css': 'text'
    },
    define: {
      'process.env.NODE_ENV': '"production"',
      'process.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL || '')
    }
  });
  
  const jsCode = uiResult.outputFiles[0].text;
  console.log('UI bundle size:', Math.round(jsCode.length / 1024), 'KB');
  
  // Read HTML template
  const htmlTemplate = fs.readFileSync('src/ui/index.html', 'utf8');
  
  // Inline the JavaScript
  const htmlWithInlineJS = htmlTemplate.replace(
    '<!-- JavaScript will be inlined by build process -->',
    `<script>${jsCode}</script>`
  );
  
  // Write final HTML file
  fs.writeFileSync('build/ui.html', htmlWithInlineJS);
  
  // Create properly escaped HTML for main.js injection
  const escapedHTML = JSON.stringify(htmlWithInlineJS);
  console.log('HTML escaped for injection, size:', Math.round(escapedHTML.length / 1024), 'KB');
  
  // Build main.js with injected HTML
  console.log('Building main.js...');
  
  await esbuild.build({
    entryPoints: ['src/main.ts'],
    outfile: 'build/main.js',
    bundle: true,
    platform: 'browser',
    sourcemap: true,
    external: [],
    define: {
      '__html__': escapedHTML,
      'process.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL || '')
    }
  });
  
  console.log('Build complete!');
};

(async () => {
  try {
    if (watch) {
      console.log('⚠️  Watch mode not fully supported with inline build. Use "npm run build" after changes.');
    }
    
    await buildComplete();
    console.log('✅ Build complete with inlined UI');
  } catch (err) {
    console.error('❌ Build failed:', err);
    process.exit(1);
  }
})(); 