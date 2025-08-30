# Bibliography & Formatting

These pages provide ORCID-powered bibliography tools and simple formatting exports.

- Visit `/bibliography` to explore works, import CSV data, tag concepts, and create wikitext blocks.
- Visit `/formatting` to render selected items in various citation styles and copy export snippets.

## Usage

1. Run the local proxy server with `node server/index.js`.
2. In another terminal, start the frontend via `npm run dev` from `site/`.
3. The bibliography will load works for the default ORCID.

### CSV import

Uploads expect a UTF-8 CSV with the header:

```
id,title,year,type,venue,doi,isbn13
```

### Wikipedia blocks

Use the "Wikipedia" export in Formatting to generate wikitext suitable for article references.

The proxy server reads ORCID data and normalizes it for the frontend store.
