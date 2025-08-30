# ORCID Verification Guide

This guide explains how to verify ORCID iDs for scholars and update the Vault.

## Steps
1. Go to [https://orcid.org/](https://orcid.org/).
2. Enter the scholar's full name in the search bar.
3. Review results and confirm affiliation or field matches the scholar.
4. Copy the full ORCID iD (format `0000-000X-XXXX-XXXX`).
5. Paste the ID into `site/public/scholars/scholars.json` for the matching scholar.
6. Include the ORCID profile link in your pull request description to document verification.

### Example
```json
{
  "name": "Ian Buchanan",
  "orcid": "0000-0002-1825-0097"
}
```
*Example ORCID record: [https://orcid.org/0000-0002-1825-0097](https://orcid.org/0000-0002-1825-0097)*

## Checklist
- [ ] Verified ORCID pasted into `scholars.json`.
- [ ] PR description updated with ORCID link.
- [ ] Ambiguous results noted as "No ORCID found".
