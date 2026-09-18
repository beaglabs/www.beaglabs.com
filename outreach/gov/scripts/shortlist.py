#!/usr/bin/env python3
"""
shortlist.py — collapse the master list into the small set a founder should actually work.

The full list is a research artifact: 1,300+ rows, most of which are routing desks. This
produces one best contact per organisation, restricted to the tiers that can move Papyrus,
so the output is something you can work through in a sitting.

Output: outreach/gov/shortlist.csv
"""
import csv, os, re
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, 'contacts.csv')
OUT = os.path.join(ROOT, 'shortlist.csv')

# role quality: prefer a real person or a purpose-built BD mailbox over a generic desk
GOOD = re.compile(r'sourcing|vendor|industry (engagement|liaison|day)|partner|'
                  r'procurement center|business opportunity|small business (specialist|'
                  r'professional|liaison|director|program)|SBLO|supplier diversity|'
                  r'innovation|scouting|front door|onramp|SBIR|STTR|CSO|'
                  r'requirements|software|tech ?bridge', re.I)
BAD = re.compile(r'public affairs|inspector general|congressional|media|press|FOIA|'
                 r'human resources|\bHR\b|career|webmaster|ombuds|IG\b|helpdesk|'
                 r'privacy|security|training|acquisition workforce', re.I)

TIER_ORDER = {'P1': 0, 'P2': 1, 'P4': 2, 'P5': 3, 'P3': 4, 'P6': 5, 'P7': 6}


def org_key(org):
    o = org.lower()
    o = re.sub(r'\b(inc|llc|ltd|corporation|corp|company|co|the|technologies|systems|'
               r'technical services|services)\b', '', o)
    o = re.sub(r'[^a-z0-9 ]', ' ', o)
    o = ' '.join(o.split())
    return o[:28]


def score(r):
    s = 0
    if r['verified'] == 'confirmed':
        s += 40
    elif r['verified'].startswith('unchecked'):
        s += 20
    if r['person'].strip():
        s += 15
    if GOOD.search(r['role']):
        s += 25
    if BAD.search(r['role']):
        s -= 45
    if r['channel'] == 'email':
        s += 10
    return s


def main():
    rows = [r for r in csv.DictReader(open(SRC, newline='')) if r['email']]
    best = {}
    for r in rows:
        if r['relevance'] == 'low':
            continue
        if BAD.search(r['role']) and not GOOD.search(r['role']):
            continue
        k = org_key(r['org'])
        if k not in best or score(r) > score(best[k]):
            best[k] = r
    out = sorted(best.values(),
                 key=lambda r: (TIER_ORDER.get(r['priority'][:2], 9), -score(r)))
    cols = ['priority', 'org', 'role', 'person', 'email', 'verified', 'source']
    with open(OUT, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction='ignore')
        w.writeheader()
        w.writerows(out)
    print(f'shortlist rows: {len(out)} -> {OUT}\n')
    for r in out:
        v = 'OK ' if r['verified'] == 'confirmed' else '~  '
        print(f"{v}{r['priority'][:2]} {r['email'][:46]:46} {r['org'][:34]:34} {r['role'][:34]}")


if __name__ == '__main__':
    main()
