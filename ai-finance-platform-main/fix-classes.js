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
      if (file.endsWith('.jsx') || file.endsWith('.js')) results.push(file);
    }
  });
  return results;
}

const files = walk('app/(main)');
const cleanups = [
  [/dark:text-slate-[0-9]+\s+dark:text-white/g, 'dark:text-white'],
  [/dark:text-slate-[0-9]+\s+dark:text-slate-([0-9]+)/g, 'dark:text-slate-$1'],
  [/(?:dark:bg-(?:white|slate-[0-9]+)\s+)+dark:bg-\[/g, 'dark:bg-['],
  [/(?:dark:bg-(?:white|slate-[0-9]+)\s+)+dark:bg-slate-([0-9]+)/g, 'dark:bg-slate-$1'],
  [/(?:dark:border-slate-[0-9]+\s+)+dark:border-slate-([0-9]+)/g, 'dark:border-slate-$1'],
  [/(?:dark:border-slate-[0-9]+\s+)+dark:border-white\/5/g, 'dark:border-white/5'],
  [/(?:dark:hover:bg-slate-[0-9]+\s+)+dark:hover:bg-slate-([0-9]+)/g, 'dark:hover:bg-slate-$1'],
  [/(?:dark:hover:text-slate-[0-9]+\s+)+dark:hover:text-white/g, 'dark:hover:text-white'],
  [/(?:dark:hover:bg-slate-[0-9]+\s+)+dark:hover:bg-white\/\[0\.02\]/g, 'dark:hover:bg-white/[0.02]'],
  [/dark:hover:text-slate-[0-9]+\s+dark:hover:text-slate-([0-9]+)/g, 'dark:hover:text-slate-$1'],
  [/dark:border-slate-[0-9]+\s+dark:border-slate-800\//g, 'dark:border-slate-800/'],
  [/(?:dark:bg-slate-[0-9]+\s+)+dark:bg-slate-800\//g, 'dark:bg-slate-800/']
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  for(let i=0; i<3; i++) {
    cleanups.forEach(([regex, repl]) => {
      content = content.replace(regex, repl);
    });
  }
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Cleaned up', file);
  }
});
