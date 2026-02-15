# 🎭 Aegis Protocol: Judge's Official Demo Script

Use these 5 curated scenarios to demonstrate the **Forensic Agent Economy**. 

> **Important**: All examples use real-world tokens on the **Base Network**. 
> Current Base State (Forked): **ETH** ~$3,115 | **USDC** $1.00

---

### 🟢 1. The Blue-Chip Approval (Happy Path)
**Goal**: Show that Aegis doesn't block legitimate, high-liquidity commerce.
- **Story**: A whale is moving capital into Circle's official USDC.
- **Copy-Paste Prompt**:
  ```text
  Swap 1.5 ETH for USDC
  ```
- **What to tell the judges**: *"Watch the center vault lock the ETH. Our oracle verifies this is the official Circle contract on Base. The logic and AI both return Risk Code 0. Transaction settled."*

---

### 🔴 2. The Deterministic Honeypot (Hard Logic)
**Goal**: Show the "Left Brain" catching a mathematically proven scam.
- **Story**: A user is lured into a high-tax honeypot token.
- **Copy-Paste Prompt**:
  ```text
  Swap 0.1 ETH for 0x5a31705664a6d1dc79287c4613cbe30d8920153f
  ```
- **What to tell the judges**: *"Here, the Logic Brain takes over. GoPlus immediately flags this address as a honeypot. We don't even need the AI's opinion—Aegis halts the trade on-chain and refunds the user."*

---

### 🟡 3. The "Split-Brain" Disagreement (BRETT)
**Goal**: Show the "Union of Fears" consensus model in action.
- **Story**: A high-risk meme asset where AI models disagree on the "Based" nature of the token.
- **Copy-Paste Prompt**:
  ```text
  Swap 1000 BRETT for ETH
  ```
- **What to tell the judges**: *"This is our Split-Brain consensus. GPT-4o sees a community token, but Llama-3 flags potential impersonation of legacy branding. Because Aegis follows the 'Union of Fears'—if any model flags a risk, we block it for the user's safety."*

---

### 🔴 4. The "Union of Fears" (The Pure AI Save)
**Goal**: Show the "Right Brain" catching a semantic lure that logic would miss.
- **Story**: An impersonation attack using a fake USDC address. All code checks pass, but the label is the lie.
- **Copy-Paste Prompt**:
  ```text
  Swap 0.5 ETH for fake_usdc
  ```
- **What to tell the judges**: *"This is a pure AI victory. The contract logic is standard ERC20, but the AI recognizes the name 'USDC' on an unauthorized address. It's a semantic trap caught by the machine's reasoning."*

---

### 🔍 5. The Holistic Investigator (DEGEN L3 Audit)
**Goal**: Show the forensic analyzer auditing development transparency.
- **Story**: A utility token on an L3 network with suspicious lack of public code history.
- **Copy-Paste Prompt**:
  ```text
  Audit 5000 DEGEN and swap if safe
  ```
- **What to tell the judges**: *"Aegis is also a forensic investigator. It flags DEGEN here not because of a bug, but because of a lack of GitHub transparency and unverified source code proxies. It protects users from 'Black Box' protocols."*

---

### 💡 Pro-Tip for Judges
Monitor the **System Logs** at the bottom to see the parallel dispatch of GPT-4o and Llama-3 in real-time. This is **Real Multi-Model Consensus**, not a wrapper.
