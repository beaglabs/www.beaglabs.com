#!/usr/bin/env python3
"""
recheck-jina.py — second-pass verification for pages the plain fetcher could not settle.

Why: many vendor/agency contact pages are JavaScript-rendered, so a raw curl returns a
shell with no addresses even when the address is genuinely published on the page. That
produces false "NOT-ON-PAGE" verdicts. The r.jina.ai reader executes the page and returns
rendered text, which settles those cases. It is per-IP rate limited, so this script
paces requests and backs off on 429 rather than hammering it.

Reads raw/verify.tsv, re-checks every address whose verdict is not CONFIRMED,
writes raw/verify2.tsv.
"""
import csv, os, re, subprocess, sys, time, html
from collections import defaultdict, Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
IN = os.path.join(ROOT, 'raw', 'verify.tsv')
OUT = os.path.join(ROOT, 'raw', 'verify2.tsv')
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/122.0 Safari/537.36')
ARCHIVE_RX = re.compile(r'web\.archive\.org')


CHALLENGE = ('just a moment', 'cf-browser-verification', 'enable javascript and cookies',
             'attention required', 'rate limited', 'ratelimittriggered')


def challenged(blob):
    low = blob[:4000].lower()
    return any(m in low for m in CHALLENGE)


def jina(url, tries=4):
    """Read via r.jina.ai. NOTE: do NOT send a browser User-Agent -- that trips the
    proxy's own Cloudflare challenge and silently yields a challenge page instead of
    content, which would look like a failed verification rather than a failed fetch."""
    for attempt in range(tries):
        try:
            blob = subprocess.run(
                ['curl', '-sL', '--max-time', '75', 'https://r.jina.ai/' + url],
                capture_output=True, timeout=100).stdout.decode('utf-8', 'ignore')
        except Exception:
            blob = ''
        if len(blob) > 600 and not challenged(blob):
            return blob
        wait = 12 * (attempt + 1)
        print(f'      retry in {wait}s (challenge/429/short response)')
        sys.stdout.flush()
        time.sleep(wait)
    return ''


def main():
    rows = [r for r in csv.DictReader(open(IN, newline=''), delimiter='\t')]
    targets = defaultdict(list)
    for r in rows:
        if r['verdict'] != 'CONFIRMED':
            targets[r['source_url']].append(r)

    # archive.org snapshots point at the same document; re-check the live original too
    results = []
    for url, group in sorted(targets.items()):
        fetch_url = url
        if ARCHIVE_RX.search(url):
            m = re.search(r'https?://web\.archive\.org/web/[^/]+/(https?://.*)$', url)
            if m:
                fetch_url = m.group(1)
        print(f'  fetching {fetch_url[:105]}')
        sys.stdout.flush()
        raw = jina(fetch_url)
        text = re.sub(r'\s+', ' ', html.unescape(raw)).lower()
        ok = len(text) > 500
        for r in group:
            found = ok and r['email'].lower() in text
            results.append({
                'email': r['email'], 'org': r['org'], 'source_url': url,
                'verdict': 'CONFIRMED' if found else ('STILL-UNVERIFIED' if ok else 'UNREACHABLE'),
                'source_kind': 'jina-rendered',
            })
        print(f'      -> {sum(1 for x in results[-len(group):] if x["verdict"]=="CONFIRMED")}'
              f'/{len(group)} confirmed')
        time.sleep(4)

    with open(OUT, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=['email', 'org', 'source_url', 'verdict', 'source_kind'],
                           delimiter='\t')
        w.writeheader()
        w.writerows(results)
    print('\n' + '=' * 70)
    for k, n in Counter(r['verdict'] for r in results).most_common():
        print(f'{n:5d}  {k}')
    print(f'-> {OUT}')


if __name__ == '__main__':
    main()
