export type BiblioItem = {
  id: string;                 // stable UID (hash of title+year or ORCID putcode)
  source: 'orcid' | 'csv' | 'manual';
  orcidPutcode?: string;
  title: string;
  subtitle?: string;
  authors: { family: string; given?: string; orcid?: string }[];
  year?: number;
  type: 'book' | 'article' | 'chapter' | 'edited-volume' | 'thesis' | 'other';
  publisher?: string;
  venue?: string;             // journal or series
  isbn13?: string;
  doi?: string;
  urls: { label: 'Publisher'|'Google Books'|'PhilPapers'|'Crossref'|'DOI'; href: string }[];
  concepts: string[];         // tags like Assemblage, Affect, etc.
  scholarScore?: number;      // citations (normalized)
  notes?: string;             // user notes
  raw?: any;                  // raw payloads for audit/debug
};
