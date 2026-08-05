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
const replacements = [
  [/\bbg-\[\#141B2D\]/g, 'bg-white dark:bg-[#141B2D]'],
  [/\btext-white/g, 'text-slate-900 dark:text-white'],
  [/\bbg-slate-800\b/g, 'bg-slate-100 dark:bg-slate-800'],
  [/\bbg-slate-800\/([0-9]+)/g, 'bg-slate-100 dark:bg-slate-800/$1'],
  [/\bbg-\[\#1E293B\]/g, 'bg-white dark:bg-[#1E293B]'],
  [/\bbg-\[\#0F172A\]/g, 'bg-white dark:bg-[#0F172A]'],
  [/\bbg-\[\#0B1120\]/g, 'bg-slate-50 dark:bg-[#0B1120]'],
  [/\bborder-white\/5/g, 'border-slate-200 dark:border-white/5'],
  [/\bborder-slate-700\/([0-9]+)/g, 'border-slate-200 dark:border-slate-700/$1'],
  [/\bborder-slate-700\b/g, 'border-slate-200 dark:border-slate-700'],
  [/\bborder-slate-800\/([0-9]+)/g, 'border-slate-200 dark:border-slate-800/$1'],
  [/\bborder-slate-800\b/g, 'border-slate-200 dark:border-slate-800'],
  [/\btext-slate-400\b/g, 'text-slate-500 dark:text-slate-400'],
  [/\btext-slate-300\b/g, 'text-slate-600 dark:text-slate-300'],
  [/\btext-slate-200\b/g, 'text-slate-700 dark:text-slate-200'],
  [/\bhover:bg-slate-700\b/g, 'hover:bg-slate-200 dark:hover:bg-slate-700'],
  [/\bhover:bg-slate-700\/([0-9]+)/g, 'hover:bg-slate-200 dark:hover:bg-slate-700/$1'],
  [/\bhover:text-white\b/g, 'hover:text-slate-900 dark:hover:text-white'],
  [/\bhover:bg-white\/\[0\.02\]/g, 'hover:bg-slate-50 dark:hover:bg-white/[0.02]']
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  replacements.forEach(([regex, repl]) => {
    content = content.replace(regex, repl);
  });
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
