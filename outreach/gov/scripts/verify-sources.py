#!/usr/bin/env python3
"""
verify-sources.py — independently re-fetch each source and confirm the address really
appears on the page/document it is attributed to.

This is the anti-hallucination gate. Addresses a researcher produced by pattern-guessing
rather than by reading a page fail here and get flagged, not shipped.

Handles the three source shapes that actually occur in this dataset:
  * HTML pages            -> strip tags, search text
  * PDFs                  -> pdftotext, then search (many SBLO directories are PDFs)
  * Akamai-blocked .mil   -> retry through the r.jina.ai reader

Verdicts:
  CONFIRMED            address found in the fetched source
  NOT-ON-PAGE          page fetched fine, address genuinely absent -> do not trust
  PDF-NO-TEXT          source is a scanned/unextractable PDF -> verify by hand
  FETCH-FAILED         source unreachable from here -> verify by hand

Usage: python3 verify-sources.py [contacts.csv] [--out verify.tsv]
"""
import csv, os, re, subprocess, sys, html, time, tempfile
from collections import defaultdict, Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/122.0 Safari/537.36')


CHALLENGE = ('just a moment', 'cf-browser-verification', 'enable javascript and cookies',
             'attention required', 'ratelimittriggered')


def curl(url, proxy=False, timeout=45):
    # The reader proxy must NOT receive a browser User-Agent: that trips its own
    # Cloudflare challenge and returns a challenge page instead of content.
    cmd = ['curl', '-sL', '--max-time', str(timeout)]
    if not proxy:
        cmd += ['-A', UA]
    try:
        out = subprocess.run(cmd + [('https://r.jina.ai/' + url) if proxy else url],
                             capture_output=True, timeout=timeout + 20).stdout
    except Exception:
        return b''
    low = out[:4000].lower()
    if any(m.encode() in low for m in CHALLENGE):
        return b''
    return out


def pdf_text(blob):
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
        f.write(blob)
        path = f.name
    try:
        out = subprocess.run(['pdftotext', '-q', path, '-'],
                             capture_output=True, timeout=60).stdout
        return out.decode('utf-8', 'ignore')
    except Exception:
        return ''
    finally:
        os.unlink(path)


def get_text(url):
    """Return (searchable_text, kind). kind describes how the source was obtained.

    The searchable text deliberately KEEPS <script> blocks: contact addresses are
    frequently published only in schema.org JSON-LD or a mailto: inside a script, and
    stripping scripts produced false "not on page" verdicts for real addresses.
    """
    blob = curl(url)
    if blob[:5] == b'%PDF-':
        txt = pdf_text(blob)
        return (txt, 'pdf') if txt.strip() else ('', 'pdf-notext')
    if len(blob) < 600 or b'Access Denied' in blob[:3000]:
        alt = curl(url, proxy=True, timeout=70)  # jina: no UA, see recheck-jina.py
        if alt[:5] == b'%PDF-':
            txt = pdf_text(alt)
            return (txt, 'pdf') if txt.strip() else ('', 'pdf-notext')
        if len(alt) > len(blob):
            blob = alt
    if not blob.strip():
        return '', 'failed'
    txt = blob.decode('utf-8', 'ignore')
    txt = html.unescape(txt).replace('\\u0040', '@').replace('%40', '@')
    txt = re.sub(r'<style.*?</style>', ' ', txt, flags=re.S | re.I)
    txt = re.sub(r'\s+', ' ', txt)
    if len(txt) < 300:
        return txt, 'failed'
    return txt, 'html'


def main():
    csv_path = next((a for a in sys.argv[1:] if not a.startswith('-')), None) or \
        os.path.join(ROOT, 'contacts.csv')
    out = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else \
        os.path.join(ROOT, 'raw', 'verify.tsv')

    rows = list(csv.DictReader(open(csv_path, newline='', encoding='utf-8-sig')))
    by_url = defaultdict(list)
    for r in rows:
        src = r.get('source', '') or ''
        if r.get('email') and src.startswith('http') and 'web.archive.org' not in src:
            by_url[src].append(r)

    verdicts = []
    for url, group in sorted(by_url.items()):
        text, kind = get_text(url)
        low = text.lower()
        n_ok = 0
        for r in group:
            found = r['email'].lower() in low
            n_ok += found
            verdicts.append({
                'email': r['email'], 'org': r['org'], 'source_url': url,
                'verdict': 'CONFIRMED' if found else
                           {'pdf-notext': 'PDF-NO-TEXT', 'failed': 'FETCH-FAILED'}
                           .get(kind, 'NOT-ON-PAGE'),
                'source_kind': kind,
            })
        print(f'{n_ok:3d}/{len(group):3d}  [{kind:9}] {url[:100]}')
        sys.stdout.flush()
        time.sleep(0.3)

    with open(out, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=['email', 'org', 'source_url', 'verdict', 'source_kind'],
                           delimiter='\t')
        w.writeheader()
        w.writerows(verdicts)

    print('\n' + '=' * 72)
    for k, n in Counter(v['verdict'] for v in verdicts).most_common():
        print(f'{n:5d}  {k}')
    print(f'total {len(verdicts)} addresses across {len(by_url)} live source pages -> {out}\n')
    suspect = sorted({v['source_url'] for v in verdicts if v['verdict'] == 'NOT-ON-PAGE'})
    if suspect:
        print('Pages where an attributed address was NOT found (treat as unverified):')
        for s in suspect:
            print('  -', s)
    manual = sorted({v['source_url'] for v in verdicts
                     if v['verdict'] in ('FETCH-FAILED', 'PDF-NO-TEXT')})
    if manual:
        print('\nSources needing a manual look (fetch/PDF limits, not proof of fabrication):')
        for s in manual:
            print('  -', s)


if __name__ == '__main__':
    main()
