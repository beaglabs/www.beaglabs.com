#!/usr/bin/env python3
"""
harvest-emails.py — pull PUBLISHED email addresses off public web pages, with source URLs.

Why this exists: most .mil / .gov sites block plain curl (Akamai 403). The r.jina.ai
reader proxy renders them, so it is used as the primary fetcher with a direct-curl fallback.

Usage:  python3 harvest-emails.py urls.txt [--out /path/out.tsv]
Each non-comment line of urls.txt is one URL. Prints findings and writes a TSV:
    email <TAB> source_url <TAB> page_title <TAB> context
Nothing is invented: only addresses literally present in fetched page text are emitted.
"""
import re, sys, subprocess, html, json, time

BAD = re.compile(
    r'sentry|wixpress|\.png|\.jpg|\.jpeg|\.gif|\.svg|\.webp|\.css|\.js$|example\.|domain\.com|'
    r'yourname|email@|@example|sentry\.io|w3\.org|schema\.org|highergov\.com|starbridge|'
    r'support@|noreply|no-reply|abuse@|postmaster@|webmaster@',
    re.I,
)
MAIL = re.compile(r'[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}')
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/122.0 Safari/537.36')


def fetch(url, proxy=True):
    cmd = (['curl', '-sL', '--max-time', '60', 'https://r.jina.ai/' + url] if proxy else
           ['curl', '-sL', '--max-time', '40', '-A', UA, url])
    try:
        return subprocess.run(cmd, capture_output=True, timeout=90).stdout.decode('utf-8', 'ignore')
    except Exception:
        return ''


def clean(t):
    t = re.sub(r'<script.*?</script>|<style.*?</style>', ' ', t, flags=re.S | re.I)
    t = re.sub(r'<[^>]+>', ' ', t)
    return re.sub(r'[ \t\xa0]+', ' ', html.unescape(t))


def harvest(url):
    # Direct first (fast, no quota); the r.jina.ai reader only as a fallback for
    # Akamai-fronted .mil/.gov hosts that 403 a plain curl. The proxy is per-IP
    # rate limited, so it must stay the exception, not the rule.
    raw = fetch(url, proxy=False)
    if len(raw.strip()) < 600 or 'Access Denied' in raw[:2000]:
        time.sleep(1)
        alt = fetch(url)
        if len(alt.strip()) > len(raw.strip()):
            raw = alt
    text = clean(raw)
    m = re.search(r'Title:\s*(.+)', text)
    title = m.group(1).strip()[:120] if m else ''
    found = {}
    for m in MAIL.finditer(text):
        e = m.group(0).strip('.,;:()<>"\'')
        if BAD.search(e) or len(e) > 60:
            continue
        ctx = re.sub(r'\s+', ' ', text[max(0, m.start() - 220):m.end() + 80])
        found.setdefault(e, ctx)
    return title, len(raw), found


def main():
    src = sys.argv[1]
    out_path = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else '/tmp/harvest-out.tsv'
    urls = [l.strip() for l in open(src) if l.strip() and not l.startswith('#')]
    rows, jl = [], []
    for u in urls:
        title, nbytes, found = harvest(u)
        print('=' * 100)
        print(f'URL: {u}\nTITLE: {title} | bytes: {nbytes} | emails: {len(found)}')
        for e, ctx in found.items():
            print(f'  * {e}\n     ctx: ...{ctx[-240:]}')
            rows.append((e, u, title, ctx.strip()))
        jl.append({'url': u, 'title': title, 'bytes': nbytes, 'emails': list(found)})
        sys.stdout.flush()
    with open(out_path, 'w') as f:
        f.write('email\tsource_url\tpage_title\tcontext\n')
        for r in rows:
            f.write('\t'.join(x.replace('\t', ' ') for x in r) + '\n')
    json.dump(jl, open(out_path + '.json', 'w'), indent=1)
    print(f'\nWROTE {len(rows)} email rows -> {out_path}')


if __name__ == '__main__':
    main()
