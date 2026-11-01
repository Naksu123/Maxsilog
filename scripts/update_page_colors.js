const fs = require('fs');

let s = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

// 1. Replace harsh cyan accents with cohesive AutoValue purple/indigo/slate
s = s.replaceAll('text-cyan-400', 'text-purple-400');
s = s.replaceAll('text-cyan-300', 'text-purple-300');
s = s.replaceAll('bg-cyan-500/10', 'bg-purple-500/10');
s = s.replaceAll('bg-cyan-500/20', 'bg-purple-500/20');
s = s.replaceAll('border-cyan-500/30', 'border-purple-500/30');
s = s.replaceAll('border-cyan-400', 'border-purple-400');
s = s.replaceAll('border-cyan-900/40', 'border-purple-900/40');
s = s.replaceAll('text-blue-400', 'text-purple-300');
s = s.replaceAll('bg-blue-500/10', 'bg-purple-500/10');
s = s.replaceAll('border-blue-500/30', 'border-purple-500/30');
s = s.replaceAll('bg-blue-600/20', 'bg-purple-600/20');
s = s.replaceAll('bg-cyan-600/20', 'bg-indigo-600/20');
s = s.replaceAll('border-blue-900/40', 'border-slate-800');
s = s.replaceAll('border-blue-900/50', 'border-purple-900/40');
s = s.replaceAll('from-cyan-400 to-blue-300', 'from-purple-300 via-indigo-200 to-white');
s = s.replaceAll('bg-blue-600 hover:bg-blue-500', 'bg-purple-600 hover:bg-purple-500');

// 2. Soften headings and text to blend with dark obsidian glass
s = s.replaceAll('text-white drop-shadow-md', 'text-slate-100');
s = s.replaceAll('text-white drop-shadow', 'text-slate-100');
s = s.replaceAll('text-slate-300 leading-relaxed', 'text-slate-400 leading-relaxed font-sans');
s = s.replaceAll('text-slate-200 max-w-2xl', 'text-slate-300 max-w-2xl');
s = s.replaceAll('text-slate-200 leading-relaxed', 'text-slate-300 leading-relaxed');

// 3. CTA buttons gradient
s = s.replaceAll(
  'from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500',
  'from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500'
);

fs.writeFileSync('frontend/src/app/page.tsx', s, 'utf8');
console.log('Successfully updated page.tsx text colors to blend with UI');

