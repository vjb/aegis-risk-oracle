# Aegis Risk Oracle - Demo Video Script

**Duration**: 3-5 minutes  
**Format**: Screen recording with voiceover

---

## 00:00-00:30 | INTRODUCTION (30s)

### Screen: README or Architecture Diagram
**Voiceover:**
> "Hi! This is Aegis, an AI-powered risk oracle built with Chainlink CRE. Aegis prevents autonomous agents—whether built with ElizaOS, LangChain, or other frameworks—from executing scam trades by providing real-time risk assessments across any EVM blockchain."

**Show:**
- Project title and description
- Architecture diagram (Agent → CRE Workflow → Smart Contract)

---

## 00:30-01:00 | THE PROBLEM (30s)

### Screen: Highlight problem statement in README
**Voiceover:**
> "AI agents like ElizaOS or LangChain are increasingly executing DeFi trades autonomously, but they lack built-in safeguards. They can unknowingly trade honeypot tokens, fall victim to price manipulation, or interact with scam contracts. Aegis solves this by acting as a mandatory risk checkpoint before any trade executes."

**Show:**
- Problem bullets from README
- Quick example of a honeypot token address

---

## 01:00-01:45 | CODE WALKTHROUGH (45s)

### Screen: aegis-workflow/main.ts
**Voiceover:**
> "The Aegis workflow is built with Chainlink CRE. It's HTTP-triggered, so agents can call it like any REST API. When a request comes in, the workflow validates the payload using Zod schema..."

**Scroll through code showing:**
1. HTTP trigger setup (line ~243)
2. Zod validation (line ~10-18)
3. API integrations section:
   - "Then it fetches real-time data from market and security sources in parallel to maximize performance:"
   - CoinGecko and GoPlus Labs (Fetched in parallel!)
   - OpenAI GPT-4 (Contextual AI Risk analysis)

**Show:**
- Import statements
- Request schema
- API integration code (lines 50-175)

---

## 01:45-03:30 | LIVE DEMO - TEST EXECUTION (1min 45s)

### Screen: Terminal running ./test-aegis.sh
**Voiceover:**
> "Let's see it in action. I've created three test scenarios."

### Test 1: PASS (30s)
**Voiceover:**
> "First, a legitimate trade: WETH on Base with a fair asking price. Watch as it fetches live data from all four APIs..."

**Highlight in terminal:**
- ✓ Payload validated
- ✓ ETH Price: $2054
- ✓ Verifiable Randomness (VRF)
- ✓ Security Check - Trust List: true
- ✓ Risk Score: 5/10
- ⚖️ FINAL VERDICT: **EXECUTE**

**Voiceover:**
> "The AI correctly identifies this as low-risk. Notice it even generates a signed result - in production, this signature would be verified by a smart contract."

### Test 2: FAIL (30s)
**Voiceover:**
> "Now, a malicious scenario: a suspicious token with a 2.4x price markup. This simulates price manipulation..."

**Highlight:**
- Token address: 0x000...001 (burn address)
- Asking Price: $5000 vs Market: $2054
- Trust List: false
- Risk Score: 10/10
- ⚖️ FINAL VERDICT: **REJECT**

**Voiceover:**
> "Perfect! The AI caught the manipulation. The asking price deviates over 50% from market, triggering an automatic rejection."

### Test 3: Invalid Payload (20s)
**Voiceover:**
> "Finally, error handling: a payload missing required fields."

**Highlight:**
- ❌ Invalid payload
- Zod validation errors
- Decision: REJECT with detailed error message

**Voiceover:**
> "The Zod schema validation catches this immediately and returns a structured error."

### Phase 2: Live Security Proofs (1min)
**Screen: Terminal running ./test-crypto.ps1**
**Voiceover:**
> "But intel is nothing without integrity. Even if our oracle backend was compromised, we use a 'Triple Lock' cryptographic signature. Let's run our dedicated security demo."

**Highlight in terminal:**
- [PROOF 1] Protocol Compliance: **PASSED ✓**
- [PROOF 2] Value Lock: **BLOCKED ✓** (Attacker tried to change the price)
- [PROOF 3] Identity Lock: **BLOCKED ✓** (Attacker tried to hijack the signature)
- [PROOF 4] Replay Detection: **BLOCKED ✓** (Preventing double-use of same approval)
- [PROOF 5] Time Lock: **BLOCKED ✓** (Preventing late approvals)

**Voiceover:**
> "As you can see, the 'Triple Lock' protects the identity of the user, the exact value of the trade, and the time validity of the signal. This ensures Aegis is immutable and tamper-proof."

---

## 03:30-04:15 | PRODUCTION INTEGRATION (45s)

### Screen: MOCK_SIGNATURE_DEMO.md or architecture diagram
**Voiceover:**
> "In production, here's how it works: An AI agent sends a trade request via HTTP. The Chainlink DON runs consensus across multiple nodes, fetches all the data, and the AI analyzes it. The DON then signs the result with its private key."

**Show:**
1. Flow diagram: Agent → HTTP → DON → Signature
2. Mock signature in terminal output

**Voiceover:**
> "The agent submits this signed result to the Aegis smart contract on Base. The contract verifies the signature came from the authorized DON, checks the risk score, and only allows EXECUTE decisions with acceptable risk. This prevents agents from bypassing the oracle or faking good risk scores."

**Show:**
- Signature field: `0x0b0ac84d89...`
- DON public key
- Note about production verification

---

## 04:15-04:45 | INTEGRATIONS & VALUE (30s)

### Screen: README showing API integrations table
**Voiceover:**
> "Aegis integrates three external systems: CoinGecko for market data, GoPlus Labs for security analysis, and OpenAI GPT-4 for intelligent risk scoring. It also supports cross-chain deployment - this same oracle works on Base, BSC, Ethereum, or any EVM network."

**Show:**
- API integrations table
- Chain ID examples in test payloads

---

## 04:45-05:00 | CLOSING (15s)

### Screen: GitHub repo or README top section
**Voiceover:**
> "Aegis is production-ready, follows Chainlink CRE best practices, and demonstrates how decentralized oracles can make AI agents safer and more reliable. Thanks for watching! Check out the GitHub repo for the full code."

**Show:**
- GitHub repo URL
- Chainlink badge
- Project structure

**End screen:**
- Project name: Aegis Risk Oracle
- Category: Risk & Compliance
- Built with: Chainlink CRE
- GitHub link

---

## Recording Tips

1. **Use OBS or Loom** for screen recording
2. **Test audio** - clear voiceover is critical
3. **Zoom in on code** - make text readable
4. **Slow down at key moments** - let results display fully
5. **Add captions** - improves accessibility
6. **Terminal colors** - use a high-contrast theme
7. **Practice once** - smooth delivery matters

## Before Recording Checklist

- [ ] Clean terminal (run `clear`)
- [ ] Close unnecessary tabs
- [ ] Set terminal font size to 16+
- [ ] Test `./test-aegis.sh` runs cleanly
- [ ] Have README open in another tab
- [ ] Practice transitions between screens
- [ ] Time yourself (aim for 4 minutes)

## Upload Destinations

- **YouTube**: Public, unlisted is fine
- **Loom**: Easy sharing, good quality
- **Vimeo**: Professional option

Include link in:
- README.md (Demo Video section)
- Hackathon submission form
- GitHub repo description

---

**Good luck! 🎬🚀**
