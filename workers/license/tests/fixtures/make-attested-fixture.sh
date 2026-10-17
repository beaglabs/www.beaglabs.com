#!/usr/bin/env bash
# Regenerates tests/fixtures/attested.json: a synthetic IMDS attested-data
# signature built with OpenSSL (an independent CMS implementation), using a
# throwaway test root -> intermediate -> leaf (SAN eastus.metadata.azure.com).
# A real IMDS document can only be produced on an Azure VM and expires within
# hours, so tests use this fixture and inject the test root as trusted.
# Like IMDS, the PKCS#7 embeds only the signer certificate; the intermediate is
# served through the leaf's AIA "CA Issuers" URL (faked in the test).
set -euo pipefail
OUT=${OUT:-$(cd "$(dirname "$0")" && pwd)/attested.json}
export OUT
cd "$(dirname "$0")"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
cd "$work"

cat > ext.cnf <<CNF
[root]
basicConstraints=critical,CA:true
keyUsage=critical,keyCertSign,cRLSign
[inter]
basicConstraints=critical,CA:true,pathlen:0
keyUsage=critical,keyCertSign,cRLSign
[leaf]
basicConstraints=CA:false
keyUsage=critical,digitalSignature
subjectAltName=DNS:eastus.metadata.azure.com,DNS:metadata.azure.com
authorityInfoAccess=caIssuers;URI:http://www.microsoft.com/pkiops/certs/Test%20Azure%20Issuing%20CA.crt
CNF

openssl req -x509 -newkey rsa:2048 -nodes -keyout root.key -out root.pem -days 7300 -subj "/CN=Test Azure Root" \
  -addext "basicConstraints=critical,CA:true" -addext "keyUsage=critical,keyCertSign,cRLSign"
openssl req -newkey rsa:2048 -nodes -keyout inter.key -out inter.csr -subj "/CN=Test Azure Issuing CA"
openssl x509 -req -in inter.csr -CA root.pem -CAkey root.key -CAcreateserial -out inter.pem -days 7000 -sha256 -extfile ext.cnf -extensions inter
openssl req -newkey rsa:2048 -nodes -keyout leaf.key -out leaf.csr -subj "/CN=metadata.azure.com"
openssl x509 -req -in leaf.csr -CA inter.pem -CAkey inter.key -CAcreateserial -out leaf.pem -days 6000 -sha256 -extfile ext.cnf -extensions leaf

# An unrelated root, to prove an untrusted chain is rejected.
openssl req -x509 -newkey rsa:2048 -nodes -keyout other.key -out other.pem -days 7300 -subj "/CN=Untrusted Root" -addext "basicConstraints=critical,CA:true"

created=$(date -u +"%m/%d/%y %H:%M:%S -0000")
expires=$(date -u -v+6H +"%m/%d/%y %H:%M:%S -0000" 2>/dev/null || date -u -d "+6 hours" +"%m/%d/%y %H:%M:%S -0000")
verify_at=$(date -u -v+1H +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d "+1 hour" +"%Y-%m-%dT%H:%M:%SZ")
expired_at=$(date -u -v+1d +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d "+1 day" +"%Y-%m-%dT%H:%M:%SZ")
printf '%s' '{"licenseType":"","nonce":"1234567890","plan":{"name":"papyrus-standard","product":"papyrus","publisher":"beaglabs"},"sku":"papyrus-standard","subscriptionId":"8d10da13-8125-4ba9-a717-bf7490507b3d","timeStamp":{"createdOn":"'"$created"'","expiresOn":"'"$expires"'"},"vmId":"02aab8a4-74ef-476e-8182-f6d2ba4166a6"}' > doc.json
openssl smime -sign -binary -nodetach -in doc.json -signer leaf.pem -inkey leaf.key -md sha256 -outform DER -out doc.p7

der() { openssl x509 -in "$1" -outform DER | base64 | tr -d '\n'; }
VERIFY_AT=$verify_at EXPIRED_AT=$expired_at node -e '
const fs = require("fs")
const [p7, root, inter, other] = process.argv.slice(1)
fs.writeFileSync(process.env.OUT, JSON.stringify({ signature: fs.readFileSync(p7).toString("base64"), root, intermediate: inter, untrustedRoot: other, nonce: "1234567890", verifyAt: process.env.VERIFY_AT, expiredAt: process.env.EXPIRED_AT }, null, 2) + "\n")
' doc.p7 "$(der root.pem)" "$(der inter.pem)" "$(der other.pem)"
