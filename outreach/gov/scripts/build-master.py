#!/usr/bin/env python3
"""
build-master.py — merge every raw findings CSV into one normalized, filtered, verified list.

Inputs : outreach/gov/raw/*.csv   (researcher outputs) and raw/verify*.tsv (verdicts)
Outputs: outreach/gov/contacts.csv      <- outreach-ready: relevant rows only
         outreach/gov/contacts-all.csv  <- everything collected, noise included

Pipeline:
  1. lenient header mapping (researchers used different column names)
  2. dedupe case-insensitively on email, richest row wins
  3. relevance triage — a scraped mailbox is not automatically a useful target
     (SBA lender-relations staff, FOIA/press/webmaster inboxes, advisory committees
      are collected but kept out of the outreach list)
  4. attach the independent verification verdict for each address
  5. assign an outreach priority (P1 TSM pathway .. P6 portal-only)

Nothing is invented here: this script only reshapes, filters and de-duplicates.
"""
import csv, glob, os, re
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
RAW = os.path.join(ROOT, 'raw')
OUT = os.path.join(ROOT, 'contacts.csv')
OUT_ALL = os.path.join(ROOT, 'contacts-all.csv')

MAIL = re.compile(r'^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$')
FREEMAIL = re.compile(r'@(gmail|yahoo|hotmail|outlook|aol|icloud|proton|protonmail|live|msn)\.', re.I)

FIELDS = {
    'category': ['category', 'type', 'track', 'segment'],
    'org':      ['org', 'company', 'organization', 'agency', 'org_name'],
    'role':     ['office_or_role', 'office', 'role', 'program_or_office', 'title',
                 'unit_or_program', 'unit', 'program'],
    'person':   ['person_name', 'person', 'name', 'person_or_role', 'contact_name'],
    'email':    ['email', 'email_address', 'contact_email'],
    'source':   ['source_url', 'source', 'url', 'source_link'],
    'channel':  ['channel_type', 'channel', 'contact_type'],
    'notes':    ['notes', 'note', 'description', 'detail'],
}

P1 = 'P1 · TSM / Awardable pathway'
P2 = 'P2 · CSO mission owner'
P3 = 'P3 · Gov small business / SBLO-side'
P4 = 'P4 · Prime SBLO / supplier diversity'
P5 = 'P5 · Prime innovation / scouting'
P6 = 'P6 · Portal / channel only'
P7 = 'P7 · Other'

CATEGORY_RULES = [
    (P4, r'prime\s*sblo|supplier diversity|prime small business|small business liaison'),
    (P5, r'innovation|scouting|partner|venture|labs'),
    (P1, r'\btsm\b|tradewinds|awardable'),
    (P3, r'osbp|osdbu|small business|sadbu|apex accelerator|\bsba\b|procurement center|'
         r'small and disadvantaged|source development'),
    (P2, r'cso|mission owner|software factory|peo\b|program office|rapid'),
]
MISSION_RX = (r'\bDIU\b|afwerx|spacewerx|sofwerx|navalx|army applications|xtech|rccto|'
              r'space systems|kessel run|platform one|bespin|marine corps software|'
              r'afrl|army futures|naval sea systems|navair|navwar')

# --- relevance triage -------------------------------------------------------
# Bias: INCLUDE BY DEFAULT. Only mailboxes that structurally cannot advance a pilot
# (press desks, FOIA, webmasters, HR, loan/lender staff, advisory councils, IG lines,
# SBA district-office administration) are marked low. An earlier, stricter version of
# this filter silently dropped strategic rows -- e.g. success@tradewindai.com, the very
# address the TSM notice tells Awardable vendors to write to -- so the default is now
# "keep", and the P1/P2 strategic buckets are exempt from exclusion entirely.
EXCLUDE_RX = re.compile(
    r'\bFACA\b|advisory committee|women.{0,3}s business (council|committee)|office of advocacy|'
    r'ombudsman|lender relations|\bloan\b|district counsel|deputy district|district director|'
    r'district office staff|public affairs|media relations|\bpress\b|news media|webmaster|'
    r'freedom of information|\bFOIA\b|inspector general|human resources|\bHR\b|careers|'
    r'recruit|international trade|natural resource|disaster|museum|library|'
    r'equal employment|\bEEO\b|security reporting|vulnerabilit|economic development specialist|'
    r'outreach (&|and) marketing|all inquiries|general inquiries$',
    re.I)
HIGH_RX = re.compile(
    r'procurement center|business opportunity|commercial market rep|subcontract|'
    r'\bOSBP\b|\bOSDBU\b|\bSBLO\b|small business (specialist|professional|liaison|director|'
    r'program|office|team|analyst)|SBIR|STTR|\bAPEX\b|PTAC|industry liaison|innovation|'
    r'technolog|partner|scout|venture|sourcing|front door|onramp|prize|challenge|'
    r'tech ?tuesday|matchmaking|market research|requirements|software|vendor|'
    r'tradewinds|awardable|CSO\b|industry (day|engagement)', re.I)
MED_RX = re.compile(r'small business|contracting|acquisition|mission|liaison|supplier', re.I)

# --- known-bad addresses ----------------------------------------------------
# Addresses that were promoted into this pack and later proven unpublished or
# undeliverable. Hard-dropped here so no rebuild can resurrect them.
DENY_EMAILS = {
    # Provenance was a third-party vendor explainer (rise8.us), not Tradewinds.
    # Tradewinds' own current materials name ONLY success@tradewindai.com --
    # the Oct 2025 Customer Handbook lists it verbatim as "Tradewinds Help Desk /
    # Success@tradewindai.com", and it is the sole mailto on both the Opportunities
    # and FAQ pages. There is no /contact page (404). Reported undeliverable by the
    # user, 14 Sep 2026. Do not re-add without a tradewindai.com source.
    'support@tradewindai.com',
}


def pick(row, keys):
    for k in keys:
        for actual, v in row.items():
            if actual and actual.strip().lower() == k and v and v.strip():
                return v.strip()
    return ''


def relevance(cat, org, role, person, pri):
    # P1 (the TSM/Awardable pathway itself) is never filtered. P2 is NOT exempt: an earlier
    # version exempted it and let public-affairs, inspector-general and HR desks leak into
    # the "CSO mission owner" tier, which is worse than useless for outreach.
    if pri[:2] == 'P1':
        return 'high'
    hay = ' '.join([cat, org, role])
    if EXCLUDE_RX.search(role) or EXCLUDE_RX.search(org):
        return 'low'
    if HIGH_RX.search(hay):
        return 'high'
    return 'medium'                       # default keep


def priority(cat, org, role, channel):
    for label, rx in CATEGORY_RULES:
        if re.search(rx, cat, re.I):
            return label
    hay = ' '.join([cat, org, role])
    if re.search(MISSION_RX, hay, re.I):
        return P2
    return P6 if channel.lower() in ('portal', 'event', 'linkedin', 'phone') else P7


# Sources that cannot be settled by a plain re-fetch, with the honest reason. A row whose
# source lands here is reported as "unchecked", NOT as "not found" -- the address may well be
# published, but this machine cannot prove it either way.
LIMITED_SOURCES = [
    ('napex.us', 'APEX national directory publishes addresses ROT13-/URI-encoded, so a plain '
                 'string match cannot confirm them; the researcher decoded the payload'),
    ('suppliers.gendyn.com', 'GD supplier portal page publishes SBLO addresses but returns '
                             'only a partial render to this fetcher'),
    ('mn.gov', 'Minnesota APEX staff page sits behind a bot challenge'),
    ('sam.gov/opp/', 'SAM.gov notice HTML is a JS shell with no addresses; POCs are only '
                     'available through the SAM.gov API, which now requires an API key'),
    ('highergov.com', 'read via a public mirror of the SAM.gov notice, whose own HTML '
                      'contains no addresses'),
    ('noblis.org', 'Cloudflare-obfuscated address; decoded from the published payload'),
    ('noblis-esi.com', 'Cloudflare-obfuscated address; decoded from the published payload'),
    ('parsons.com', 'Cloudflare-obfuscated address; decoded from the published payload'),
    ('leidos.com', 'Cloudflare-obfuscated address; decoded from the published payload'),
    ('teamraft.com', 'Cloudflare-obfuscated address; decoded from the published payload'),
    ('secondfront.com', 'JS-rendered contact page'),
    ('accenture.com', 'Address published on a newsroom page, not a contact page'),
    ('legacy.sba.gov', 'SBA staff-directory PDFs are fetched via pdftotext; multi-URL source '
                       'fields also break single-fetch verification here'),
    ('wispro.org', 'VINTAGE 2018 DLA specialist PDF; verify before use'),
    ('web.archive.org', 'read from a Wayback snapshot because the live site blocks scripted '
                        'fetches; researcher re-fetched the snapshot live'),
]


def verdict_for(email, source, verdicts):
    key = (email.lower(), source)
    got = verdicts.get(key)
    if got == 'confirmed':
        return 'confirmed'
    for frag, why in LIMITED_SOURCES:
        if frag in source:
            short = why.split(';')[0].split(',')[0]
            return f'unchecked: {short}' if got != 'confirmed' else 'confirmed'
    return 'not-found' if got else 'unchecked'


def normalize_source(src):
    """Some researchers packed several URLs into one field separated by ';'.
    Keep the first (primary) URL for fetching/attribution; flag that more exist."""
    if not src:
        return src, ''
    parts = [p.strip() for p in re.split(r'\s*;\s*', src) if p.strip()]
    urls = [p for p in parts if p.startswith('http')]
    if len(urls) > 1:
        return urls[0], 'multiple-source-urls'
    return src.strip(), ''


def load_verdicts():
    """verdict per (email, source_url). Later passes win: verify-full.tsv matched raw
    page source (script blocks / JSON-LD included) and so is the most trustworthy."""
    v = {}
    for name in ('verify.tsv', 'verify2.tsv', 'verify-full.tsv'):
        path = os.path.join(RAW, name)
        if not os.path.exists(path):
            continue
        for r in csv.DictReader(open(path, newline=''), delimiter='\t'):
            if not r.get('email'):
                continue
            verdict = r.get('verdict', '')
            key = (r['email'].lower(), r.get('source_url', ''))
            if verdict == 'CONFIRMED':
                v[key] = 'confirmed'
            else:
                v.setdefault(key, 'not-found')
    return v


def main():
    verdicts = load_verdicts()
    rows, seen = [], {}
    for path in sorted(glob.glob(os.path.join(RAW, '*.csv'))):
        for raw in csv.DictReader(open(path, newline='', encoding='utf-8-sig')):
            r = {k: pick(raw, v) for k, v in FIELDS.items()}
            # keep rows that are actionable even without an address: a portal/event/LinkedIn
            # row with a source URL is still a real way in, and dropping them loses the
            # "primes gate innovation behind forms" picture that shapes the outreach plan.
            if not (r['email'] or r['channel'] or (r['source'] or '').startswith('http')):
                continue
            if not r['channel'] and not r['email']:
                r['channel'] = 'portal'
            if r['email'] and r['email'].lower() in DENY_EMAILS:
                continue
            if r['email'] and not MAIL.match(r['email']):
                continue
            r['source'], src_flag = normalize_source(r['source'])
            r['origin'] = os.path.basename(path)
            r['priority'] = priority(r['category'], r['org'], r['role'], r['channel'])
            r['relevance'] = relevance(r['category'], r['org'], r['role'], r['person'], r['priority'])
            r['verified'] = ('n/a' if not r['email']
                             else verdict_for(r['email'], r['source'], verdicts))
            flags = []
            if r['email'] and FREEMAIL.search(r['email']):
                flags.append('freemail')
            if src_flag:
                flags.append(src_flag)
            r['flags'] = ','.join(flags)
            key = r['email'].lower() or f"{r['org']}|{r['role']}|{r['channel']}"
            score = sum(bool(r[k]) for k in ('person', 'role', 'source', 'notes')) + \
                (2 if r['verified'] == 'confirmed' else 0)
            if key in seen:
                if score > seen[key]['_score']:
                    seen[key].update({k: v for k, v in r.items() if v})
                    seen[key]['_score'] = score
                continue
            r['_score'] = score
            seen[key] = r
            rows.append(r)

    order = {'P1': 0, 'P2': 1, 'P3': 2, 'P4': 3, 'P5': 4, 'P6': 5, 'P7': 6}
    rel_order = {'high': 0, 'medium': 1, 'low': 2}
    rows.sort(key=lambda r: (order.get(r['priority'][:2], 9), rel_order[r['relevance']],
                             r['org'].lower()))

    cols = ['priority', 'relevance', 'verified', 'category', 'org', 'role', 'person',
            'email', 'channel', 'source', 'notes', 'flags', 'origin']
    for path, data in ((OUT, [r for r in rows if r['relevance'] in ('high', 'medium')]),
                       (OUT_ALL, rows)):
        with open(path, 'w', newline='') as f:
            w = csv.DictWriter(f, fieldnames=cols, extrasaction='ignore')
            w.writeheader()
            w.writerows(data)

    print(f'contacts-all.csv : {len(rows)} rows (everything collected)')
    print(f'contacts.csv     : {len([r for r in rows if r["relevance"] in ("high", "medium")])}'
          f' rows (outreach-ready)')
    print('\nby priority (outreach list):')
    for k, v in Counter(r['priority'] for r in rows
                        if r['relevance'] in ('high', 'medium')).most_common():
        print(f'  {v:4d}  {k}')
    print('\nverification status (outreach list):')
    for k, v in Counter(r['verified'] for r in rows
                        if r['relevance'] in ('high', 'medium')).most_common():
        print(f'  {v:4d}  {k}')
    print(f'\nunique emails: {len({r["email"].lower() for r in rows if r["email"]})}')


if __name__ == '__main__':
    main()
