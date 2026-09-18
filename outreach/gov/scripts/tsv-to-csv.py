#!/usr/bin/env python3
"""
tsv-to-csv.py — convert harvest-emails.py TSV output into the master CSV schema.

The harvest TSV only knows (email, source_url, page_title, context). This maps that
into the shared schema, deriving org from the page title and role/person from the text
immediately preceding the address (where directories usually print "Name, Title").
Derived values are best-effort labels for triage only; the email + source URL are the
verified facts and are never altered here.
"""
import csv, glob, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
RAW = os.path.join(ROOT, 'raw')

TITLE_RX = re.compile(
    r'((?:Ms\.|Mr\.|Mrs\.|Dr\.)?\s*[A-Z][a-zA-Z\'\-]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-zA-Z\'\-]+)'
    r'\s*[,–\-—]\s*'
    r'((?:Director|Deputy Director|Chief|Head|Manager|Specialist|Professional|Officer|'
    r'Coordinator|Lead|Analyst|Administrator|Counselor|Advisor|Consultant|Liaison|'
    r'Source Development|Small Business)[^.;|]{0,60})')
PATH = os.path.join(ROOT, 'raw', 'gov-harvest-merged.csv')


def clean(s):
    return re.sub(r'\s+', ' ', s or '').strip()


def main():
    rows = []
    for path in sorted(glob.glob(os.path.join(RAW, '*.tsv'))):
        if path.endswith('verify.tsv'):
            continue
        with open(path, newline='', encoding='utf-8-sig') as f:
            for r in csv.DictReader(f, delimiter='\t'):
                email = clean(r.get('email'))
                src = clean(r.get('source_url'))
                ctx = clean(r.get('context'))
                title = clean(r.get('page_title')) or src
                if not email or not src:
                    continue
                person, role = '', ''
                m = TITLE_RX.search(ctx)
                if m:
                    person, role = clean(m.group(1)), clean(m.group(2))
                rows.append({
                    'category': 'Gov OSDBU / Small Business Office',
                    'org': title[:80],
                    'office_or_role': role,
                    'person_name': person,
                    'email': email,
                    'source_url': src,
                    'notes': ctx[-300:],
                })
    seen = set()
    with open(PATH, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=['category', 'org', 'office_or_role', 'person_name',
                                          'email', 'source_url', 'notes'])
        w.writeheader()
        for r in rows:
            if r['email'].lower() in seen:
                continue
            seen.add(r['email'].lower())
            w.writerow(r)
    print(f'wrote {len(seen)} unique rows -> {PATH}')


if __name__ == '__main__':
    main()
