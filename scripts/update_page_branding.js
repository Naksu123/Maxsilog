const fs = require('fs');
let s = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');
s = s.replace('text-cyan-300 font-semibold">Automotive AI', 'text-purple-300 font-semibold font-mono">AutoValue AI');
s = s.replace('bg-cyan-400 animate-pulse', 'bg-purple-400 animate-pulse');
s = s.replace('from-white via-cyan-200 to-cyan-400', 'from-white via-purple-200 to-purple-400');
s = s.replace('from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500', 'from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500');
s = s.replace('AutoValuate uses machine learning', 'AutoValue uses supervised machine learning');
fs.writeFileSync('frontend/src/app/page.tsx', s, 'utf8');
console.log('Updated page.tsx branding successfully');

