#!/bin/bash
# Customer.io Campaign Setup via beta API
# Usage: bash scripts/setup-cio.sh

KEY="a54377f6826366b4f885ada4fc01f6ca"
BASE="https://beta-api.customer.io/v1/api"
EMAILS_DIR="components/email"

echo "Creating 8 onboarding newsletter templates..."

for i in 0 2 4 6 9 12 16 20; do
  case $i in
    0)  SUBJECT="Your ML Cookbook + Where to Start";                              PREHEADER="52 recipes. 7 domains. One decision tree to find your first recipe." ;;
    2)  SUBJECT="The Smallest Models Are Getting Weirdly Good";                    PREHEADER="GRPO changed who can train frontier models. Here is the story." ;;
    4)  SUBJECT="The Death of RLHF?";                                              PREHEADER="PPO vs GRPO vs DAPO vs RLVR — a one-chart comparison." ;;
    6)  SUBJECT="Why Everyone Suddenly Cares About Synthetic Data";                 PREHEADER="Self-Instruct, Evol-Instruct, Data Flywheels — how frontier labs generate data." ;;
    9)  SUBJECT="Reasoning Isn't Magic";                                           PREHEADER="Process supervision vs outcome supervision — the mechanism behind reasoning." ;;
    12) SUBJECT="How Frontier Labs Actually Compress Huge Models";                  PREHEADER="On-policy distillation — how frontier labs compress 1.8T parameters." ;;
    16) SUBJECT="The Rise of Tiny Frontier Models";                                PREHEADER="Phi-4, Gemma 3, Qwen 2.5 — tiny models that beat giants." ;;
    20) SUBJECT="Can a 7B Model Beat a 70B Model?";                                PREHEADER="Data quality + training recipe + evaluation — the formula." ;;
  esac

  FILE="${EMAILS_DIR}/drip-day${i}.html"
  if [ ! -f "$FILE" ]; then
    echo "❌ Day $i: Template file not found: $FILE"
    continue
  fi

  # Read and strip Liquid tags to get raw HTML content
  BODY=$(node -e "
    const fs = require('fs');
    let content = fs.readFileSync('${FILE}', 'utf-8');
    // Extract content between capture tags
    const match = content.match(/{% capture content %}([\s\S]*?){% endcapture %}/);
    const body = match ? match[1].trim() : content;
    console.log(JSON.stringify(body));
  ")

  NAME="[Onboarding] Day ${i}: ${SUBJECT}"

  RESULT=$(curl -s -X POST "${BASE}/newsletters" \
    -H "Authorization: Bearer ${KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": $(echo "$NAME" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read().strip()))"),
      \"type\": \"email\",
      \"subject\": $(echo "$SUBJECT" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read().strip()))"),
      \"preheader_text\": $(echo "$PREHEADER" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read().strip()))"),
      \"body\": ${BODY}
    }")

  STATUS=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','?'))" 2>/dev/null)
  if [ "$STATUS" = "201" ] || [ "$STATUS" = "200" ]; then
    echo "✅ Day $i: $SUBJECT"
  else
    echo "❌ Day $i ($STATUS): $(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d))" 2>/dev/null | head -c 200)"
  fi
done

echo ""
echo "=== Setup complete ==="
echo "Open https://fly.customer.io/campaigns to review and schedule the campaign."
echo "Create a Journey that triggers when a person is added to the 'Newsletter Subscribers' segment (ID: 15),"
echo "then add the 8 email actions sequenced Day 0 → Day 2 → ... → Day 20 with the appropriate wait steps."