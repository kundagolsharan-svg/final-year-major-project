const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = [...walk('app'), ...walk('components')];
const replacements = [
  [/text-\[8px\]/g, 'text-[11px]'],
  [/text-\[9px\]/g, 'text-[11px]'],
  [/text-\[10px\]/g, 'text-xs'],
  [/text-\[11px\]/g, 'text-sm']
];

let filesModified = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  replacements.forEach(([regex, repl]) => {
    content = content.replace(regex, repl);
  });
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    filesModified++;
    console.log('Bumped fonts in', file);
  }
});

console.log(`Finished bumping fonts. Modified ${filesModified} files.`);
