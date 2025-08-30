function authorPart(it){
  return it.author || '';
}

export function toAPA(it){
  return `${authorPart(it)} (${it.year}). ${it.title}.`;
}

export function toChicago(it){
  return `${authorPart(it)}. ${it.title} (${it.year}).`;
}

export function toHarvard(it){
  return `${authorPart(it)} ${it.year}, ${it.title}.`;
}

export function toBibTeX(it){
  return `@misc{${it.id},\n  title={${it.title}},\n  year={${it.year}}\n}`;
}

export function toRIS(it){
  return `TY  - GEN\nTI  - ${it.title}\nPY  - ${it.year}\nER  - `;
}

export function toMarkdown(it){
  return `- ${it.title} (${it.year})`;
}

export function toWiki(it){
  let line = `* ''${it.title}'' (${it.year})`;
  if (it.isbn13) line += ` ISBN ${it.isbn13}`;
  if (it.doi) line += ` DOI ${it.doi}`;
  return line;
}
