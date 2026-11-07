# GenDungeon end-to-end report

> Live run against **Genlayer Studio Network**. Every transaction hash below can be looked up on that network.

**Result: PASSED** (27 passed, 0 failed, 1 skipped, 3 observed)

## Environment

| | |
|---|---|
| Target | GenLayer (live) |
| Network | Genlayer Studio Network |
| Contract address | 0xF7eb3Aa417c155814EB44247A1308EB23Fc02805 |
| Deployment transaction | 0x417f93c377cf0fa2d5ca4c4c29784a4cee60aa3ed76bea7f4b0ce85cb06ca858 |
| Contract SHA-256 | 7f70148e775125691bd62d7f79c7151fe1db9fed4ed5d8075153b5ff8ef0c821 |
| Repository commit | 170a168 |
| Started | 2026-11-07T15:36:42.311Z |
| Finished | 2026-11-07T16:05:33.419Z |
| Mode | full, up to 3 play attempt(s) to obtain a victory |
| Runtime | Node v22.16.0 on linux/x64 |
| Public methods parsed by the network | 28 |

## Results

| ID | Kind | Check | Result | Time | Txs |
|---|---|---|---|---|---|
| F01 | functional | The deployed contract speaks the v2 interface with the constructor settings | PASS | 4.7s | 0 |
| F02 | economic | A fresh treasury balances and is solvent | PASS | 1.2s | 0 |
| F03 | economic | The owner can fund the pool and the deposit is accounted | PASS | 44.9s | 1 |
| F04 | functional | Starting a quest writes an obstacle, takes the fee and opens the slot | PASS | 33.5s | 1 |
| F05 | functional | Submitting an action stores it and moves the quest to review | PASS | 30.8s | 1 |
| F06 | functional | Resolution scores the action and the contract derives the verdict itself | PASS | 115.6s | 2 |
| A05b | adversarial | A stranger cannot claim a won quest before its owner does | PASS | 23.9s | 1 |
| F07 | economic | Claiming pays out exactly the reserved reward once and releases the player | PASS | 35.9s | 1 |
| F08 | functional | Stats, history, renown and the hall of fame reflect the win | PASS | 8.5s | 0 |
| F09 | functional | Surrendering an unanswered quest closes it, frees the slot and clears the feed | PASS | 49.3s | 2 |
| F10 | functional | quote_reward agrees with the client-side formula for a grid of inputs | PASS | 37.9s | 0 |
| F11 | functional | validate_action dry-runs the submit-time checks | PASS | 20.9s | 0 |
| F12 | functional | The owner can tune the payout cap and the quest time limit, and reads show it | PASS | 66.7s | 4 |
| F13 | functional | Two-step ownership handover moves the keys and can be undone | PASS | 77.0s | 4 |
| A01 | adversarial | A stranger cannot change any owner setting | PASS | 114.8s | 6 |
| A02 | adversarial | Accepting ownership without a nomination, or as the wrong account, fails | PASS | 93.3s | 5 |
| A03 | adversarial | The owner cannot set nonsense parameters | PASS | 158.8s | 9 |
| A04 | adversarial | Wrong payments and unknown tiers create nothing | PASS | 116.4s | 6 |
| A05 | adversarial | Strangers cannot act on someone else's quest | PASS | 78.4s | 4 |
| A06 | adversarial | Starting a second quest while one is open is refused | PASS | 21.5s | 1 |
| A07 | adversarial | 6 injection styles are flagged by the contract's own dry-run | PASS | 14.9s | 0 |
| A08 | adversarial | Injected text is refused on-chain and the quest stays untouched | PASS | 54.6s | 3 |
| A09 | adversarial | Empty, too short and too long actions are refused on-chain | PASS | 49.4s | 3 |
| A10 | adversarial | While paused nobody can start a quest, but an open quest can still be answered and judged | PASS | 93.6s | 5 |
| A11 | adversarial | Replays are refused: double claim, re-submit and re-resolve | PASS | 87.6s | 5 |
| A12 | adversarial | Quest expiry after the time limit | skip | 0.0s | 0 |
| A13 | economic | After everything above the books still balance and the contract is solvent | PASS | 4.2s | 0 |
| O01 | observation | Social-engineering text without trigger phrases: what do the judges do? | observed | 152.7s | 4 |
| P01 | observation | Which read argument lengths does the node accept? | observed | 9.7s | 0 |
| O02 | observation | Can a long action (about 600 characters) be submitted on-chain? | observed | 49.3s | 2 |
| A14 | economic | Final accounting after all scenarios | PASS | 7.3s | 0 |

## Details

### F01. The deployed contract speaks the v2 interface with the constructor settings

Kind: functional. Result: PASS.

address 0xF7eb3Aa417c155814EB44247A1308EB23Fc02805

### F02. A fresh treasury balances and is solvent

Kind: economic. Result: PASS.

deposited 0, pool 0, reserved 0, paid out 0

### F03. The owner can fund the pool and the deposit is accounted

Kind: economic. Result: PASS.

deposited 20000000000000000, pool 20000000000000000, reserved 0, paid out 0

| Call | Transaction | Outcome |
|---|---|---|
| fundPool | `0xb189743775fed10d51d0d827d738077420812e5e503db1354bcb854d5eb20499` | accepted |

### F04. Starting a quest writes an obstacle, takes the fee and opens the slot

Kind: functional. Result: PASS.

quest #1: "You reach a narrow walkway above a cooling lava channel, but a careless smith has left a cart of iron billets "

| Call | Transaction | Outcome |
|---|---|---|
| startQuest | `0xe466f04a130a52e5ea04e7068e6e1d10ba89a17a9a542326e8cf02b5844948ac` | accepted |

### F05. Submitting an action stores it and moves the quest to review

Kind: functional. Result: PASS.

| Call | Transaction | Outcome |
|---|---|---|
| submitAction | `0x32d50264a5f47a710d8899f1e5655d573102f875211a43fb98748cdd73257e72` | accepted |

### F06. Resolution scores the action and the contract derives the verdict itself

Kind: functional. Result: PASS.

victory, scores r74/p63/c41 = 60; "They react cautiously to the rolling cart, checking their footing and trying to secure a rope before"

| Call | Transaction | Outcome |
|---|---|---|
| resolveQuest | `0x7586464e24b946a5f22cd0b971175a80dc9917d188133fcc8f260c6874881cfb` | rejected (The transaction failed on-chain (leader SUCCESS/return; leader SUCCESS/return; votes {"dis) |
| resolveQuest | `0xf1db20bf6faa878ae15c6030f374e93952cffb8d304a085fd384cf9f074108df` | accepted |

### A05b. A stranger cannot claim a won quest before its owner does

Kind: adversarial. Result: PASS.

rejected, reason verified

| Call | Transaction | Outcome |
|---|---|---|
| claimReward | `0x6700b39217076bca01beac681a002f2c72afe8727da26881eba2ab495622a7d8` | rejected (You do not own this quest) |

### F07. Claiming pays out exactly the reserved reward once and releases the player

Kind: economic. Result: PASS.

4200000000000000 wei claimed; deposited 21000000000000000, pool 16800000000000000, reserved 0, paid out 4200000000000000

| Call | Transaction | Outcome |
|---|---|---|
| claimReward | `0xd1071d9d07f3d155ac31ab479fa825c7dc90701d08f468978f40d9b9159e282a` | accepted |

### F08. Stats, history, renown and the hall of fame reflect the win

Kind: functional. Result: PASS.

rank Wanderer, renown 32

### F09. Surrendering an unanswered quest closes it, frees the slot and clears the feed

Kind: functional. Result: PASS.

| Call | Transaction | Outcome |
|---|---|---|
| startQuest | `0xe8baf4b7ce47ce3f3b0141110f831e4845f56cbe4feb2bf0f30d4b6bd443f42b` | accepted |
| surrenderQuest | `0xbed79350330a02be35dc7d6385c2f9cdb0a7381b7dba3b2a716d2f3b7ad17aec` | accepted |

### F10. quote_reward agrees with the client-side formula for a grid of inputs

Kind: functional. Result: PASS.

15 quotes match

### F11. validate_action dry-runs the submit-time checks

Kind: functional. Result: PASS.

### F12. The owner can tune the payout cap and the quest time limit, and reads show it

Kind: functional. Result: PASS.

| Call | Transaction | Outcome |
|---|---|---|
| setPayoutCap | `0xd53c7407a856db56915ecba34b52339f0011ad48ac4fe24822a6dbf15178fcd4` | accepted |
| setQuestTtl | `0x124aea3f33df79c9543a47ee9817e84396ebc2502fbb711a7d6ddd1c10339f19` | accepted |
| setFeeAndRewards | `0xcccecfa06b038b8a858a05dfddae1bb801b664e1b0d52d109440f3d51ded713b` | accepted |
| setPayoutCap | `0x2aaaa5e10df355eba5e7d683004e58b35133faf7e919a2cb94a97be553b9f137` | accepted |

### F13. Two-step ownership handover moves the keys and can be undone

Kind: functional. Result: PASS.

| Call | Transaction | Outcome |
|---|---|---|
| transferOwnership | `0x2b1748788e3a88185abb0f6a5ee54c2ef2b988f77901c9bbb5794d51833514eb` | accepted |
| acceptOwnership | `0x9bb09a41ebaf2ab49039146476a5a6125e0418c15b11b9abb58e10678182eb24` | accepted |
| transferOwnership | `0x54a3e4f8d6c872dc5eeffed188c219b63d90c3061f5535dce83bf9f1c75c9dea` | accepted |
| acceptOwnership | `0x99d4a06d0a4599a46485476b58d8f152a9206201a7cbc2c622ca610f9fbef588` | accepted |

### A01. A stranger cannot change any owner setting

Kind: adversarial. Result: PASS.

set_fee_and_rewards: rejected, reason verified; set_payout_cap: rejected, reason verified; set_quest_ttl: rejected, reason verified; set_paused: rejected, reason verified; transfer_ownership: rejected, reason verified; cancel_ownership_transfer: rejected, reason verified

| Call | Transaction | Outcome |
|---|---|---|
| setFeeAndRewards | `0xdec16a7ce681a90977779e9c69b1e0b37353fa398e4c87fac78d3d9acd0da224` | rejected (Only the owner can do this) |
| setPayoutCap | `0xd91e5457de82c85baca8c37250a0a314a3d8fdc62f56d1d41a79dd69ffc3ed9a` | rejected (Only the owner can do this) |
| setQuestTtl | `0xd205318fbaa64fe31170cb676481f26832d45d13159d9ce53a3bc4a5dfc237ee` | rejected (Only the owner can do this) |
| setPaused | `0xa568a10b5bde3e56fb8b22570feca131d3bee46377d66ba26c22783ce546b17a` | rejected (Only the owner can do this) |
| transferOwnership | `0xa3c5aa15ab7e891282cdac85b4e60e2778db5e03a22145abd34959789485efb3` | rejected (Only the owner can do this) |
| cancelOwnershipTransfer | `0xe5279e3ad533b945d2afd276ab7768cc4c324179748806dd50e1e0a2d33b2966` | rejected (Only the owner can do this) |

### A02. Accepting ownership without a nomination, or as the wrong account, fails

Kind: adversarial. Result: PASS.

rejected, reason verified; rejected, reason verified; rejected, reason verified

| Call | Transaction | Outcome |
|---|---|---|
| acceptOwnership | `0xcbc014cccaf8d552b2c53a33f3bf231cd7eb980eb0c49d152ad9890a7eb92935` | rejected (No ownership transfer is pending) |
| transferOwnership | `0xce84571a465fc0d988ec32d5b1b485216c0652d3c3b61f390ecd29669f57a464` | accepted |
| acceptOwnership | `0xb0db68798e22b66d0aac12abfd1fbf14b427fd0a58790f5710a198d07998b22d` | rejected (Only the pending owner can accept) |
| cancelOwnershipTransfer | `0x5cbf43761abb3e219adcd4799e4ce345eb38dd907a699f44ae6a8fbff0a9b2b7` | accepted |
| acceptOwnership | `0x23c60b1c01219c0ccb2352810179b32f6827ac589e320f510f8767b295cba707` | rejected (No ownership transfer is pending) |

### A03. The owner cannot set nonsense parameters

Kind: adversarial. Result: PASS.

zero fee: ok, min above max: ok, absurd fee: ok, cap zero: ok, cap over 100%: ok, ttl too short: ok, ttl too long: ok, invalid heir: ok, self as heir: ok

| Call | Transaction | Outcome |
|---|---|---|
| setFeeAndRewards | `0xfbbfb473b77722e991ecf25762bda6a7181d45d11637900563d7b838c9014f94` | rejected (entry_fee must be greater than zero) |
| setFeeAndRewards | `0x7d9582cb53b3c37ac10b71849b53cd3b3e238f33700779d75024e633fc01ef73` | rejected (min_reward cannot exceed max_reward) |
| setFeeAndRewards | `0x2fc53c2ab5b30269e6e4ec89495b0535c76fa7e12bd983a716ede8e70e7bf08b` | rejected (parameter is above the allowed maximum) |
| setPayoutCap | `0x147da51e7311f3b6527ea56d806c5785dfd2b81f444b48ed51873d4fcf07ebd0` | rejected (Payout cap must be between 1 and 10000 bps) |
| setPayoutCap | `0x10289d95e6493cb83f86476e1be364800047e09b173ef446c1d252f5f11344fb` | rejected (Payout cap must be between 1 and 10000 bps) |
| setQuestTtl | `0x5ada3bbc888e340f9872a0432fbf0b5c47df629ef93ad698f572dafcf049089d` | rejected (Quest TTL must be between 300 seconds and 30 days) |
| setQuestTtl | `0xfdb9502d7ddcc94d4413d840251f74e962b93ecea3711cb648bdc7f0e039c01f` | rejected (Quest TTL must be between 300 seconds and 30 days) |
| transferOwnership | `0x1b8925ca88e630e123cb005be707ad3841e5680fd725972fc10d9847d8e4047d` | rejected (Invalid address) |
| transferOwnership | `0xcdd383698a64245881409d0a877bd49ac38a8e3ca46394646881a01a35906db3` | rejected (Address is already the owner) |

### A04. Wrong payments and unknown tiers create nothing

Kind: adversarial. Result: PASS.

one wei short: ok, no payment: ok, tier 3: ok, tier 4294967295: ok, tier 2 paying the tier 0 price: ok, zero-value deposit: ok

| Call | Transaction | Outcome |
|---|---|---|
| startQuest | `0x97432acff09655a1d48bba335830695cfd77d1b0fe4ebc7d83fab982436c47e8` | rejected (Insufficient entry fee: sent 999999999999999, required 1000000000000000) |
| startQuest | `0x3e0560b56bd90cdf0b7b200e6ed78227e72aa2aeb8c741655f297c9697d74842` | rejected (Insufficient entry fee: sent 0, required 1000000000000000) |
| startQuest | `0xeb815c6b0fae6cbd6c389802df028982c7a2ab1333edde3c9d9814cc24a63217` | rejected (Unknown difficulty tier) |
| startQuest | `0x472dfae3293e2ed000ad8101cb9244139d30460c51c36aa1bd6437db46ea956d` | rejected (Unknown difficulty tier) |
| startQuest | `0x5db5159400d535cbde1e926285ef79b058b1195cb566ee9bc2850bea87647bd8` | rejected (Insufficient entry fee: sent 1000000000000000, required 2000000000000000) |
| fundPool | `0x6f54c5c2ed8c6974029187f78c260f300e08e21234f647649f442d86fd61d463` | rejected (Send some value to fund the pool) |

### A05. Strangers cannot act on someone else's quest

Kind: adversarial. Result: PASS.

rejected, reason verified; rejected, reason verified; rejected, reason verified

| Call | Transaction | Outcome |
|---|---|---|
| startQuest | `0xb90254a2335a35007fdef85a215a65a514f85f1d00835e9a6adde58815f6e85e` | accepted |
| submitAction | `0xd1fcc22e653c9e382cf1a90136debffeb4dd54ef72ade31ae679850bdbc8515c` | rejected (You do not own this quest) |
| claimReward | `0xea819990d309a7025bd9ff9e329caab1a01125c4f1262d5c59a0afdbc2125235` | rejected (You do not own this quest) |
| resolveQuest | `0x2188fc8dc2103d987e0724df7e580e19c7738b84a08dfc1bc23ae5503be15e78` | rejected (Quest is not awaiting resolution) |

### A06. Starting a second quest while one is open is refused

Kind: adversarial. Result: PASS.

rejected, reason verified

| Call | Transaction | Outcome |
|---|---|---|
| startQuest | `0xe1293125bb25ff39284af1811a24bb85a52e9299b912893d4f3a0f1b22d478eb` | rejected (You have a quest awaiting action, resolution, or reward claim - resolve or claim it before) |

### A07. 6 injection styles are flagged by the contract's own dry-run

Kind: adversarial. Result: PASS.

plain override, leetspeak, separators, letter spacing, role play, fake system block

### A08. Injected text is refused on-chain and the quest stays untouched

Kind: adversarial. Result: PASS.

plain override: rejected, reason verified; separators: rejected, reason verified; letter spacing: rejected, reason verified

| Call | Transaction | Outcome |
|---|---|---|
| submitAction | `0xb6f05d3b23d9734e9937c7e5d42a1847f273693d784352557e83b6b096b825b3` | rejected (Action rejected: it contains instructions aimed at the judge) |
| submitAction | `0x705a3298135fdfb06bf5306b5157a48c0c55238aafeedbd5a77895a8f24cdbc7` | rejected (Action rejected: it contains instructions aimed at the judge) |
| submitAction | `0xd05bd83b2313a1938532168b625fb5b1d2455cd0213157af2170dbaba4843792` | rejected (Action rejected: it contains instructions aimed at the judge) |

### A09. Empty, too short and too long actions are refused on-chain

Kind: adversarial. Result: PASS.

rejected, reason verified; rejected, reason verified; rejected, reason verified

| Call | Transaction | Outcome |
|---|---|---|
| submitAction | `0x7cb9647d52a0928282538ba8bd85e5bcf85ed49c4bb2f701959100b0813c1e7a` | rejected (Action text must not be empty) |
| submitAction | `0xd58b2baff5e6a0fb88f04e1ded684bb7a69143c622641012d76dbf27d532ee7f` | rejected (Action text is too short (min 10 chars)) |
| submitAction | `0x21eac480dfe23829966ac1164cd1b03c80e73468ad59514788ed077b7a3bc0c2` | rejected (Action text is too long (max 1000 chars)) |

### A10. While paused nobody can start a quest, but an open quest can still be answered and judged

Kind: adversarial. Result: PASS.

rejected, reason verified; bob's quest #3 judged while paused: victory

| Call | Transaction | Outcome |
|---|---|---|
| setPaused | `0x0c3b235aede206bbd828855e14c1d90935aa5e131571fb70f8a2042fe8a55a09` | accepted |
| startQuest | `0xfa130f1a5e137396966dc0ac3cb3ff3287bb394a863d599aea4a94af63238b1d` | rejected (The dungeon is closed for now) |
| submitAction | `0x456c4290649d40d190f07ff4089e08158e5f9192b4c6a22627ee805e17f56e14` | accepted |
| resolveQuest | `0xf01410bb53798ab16e08f2d2007a5e26ff08606443b43eb6b3780442e4e76861` | accepted |
| setPaused | `0x0bea2ec56a47d5df1227fde0e33b93a09bbfe255addb0486c9decaad979955ff` | accepted |

### A11. Replays are refused: double claim, re-submit and re-resolve

Kind: adversarial. Result: PASS.

rejected, reason verified; rejected, reason verified; stranger claim: rejected, reason verified; double claim: rejected, reason verified

| Call | Transaction | Outcome |
|---|---|---|
| submitAction | `0x0efd242b767f559f928f614621086f1c56ac900524b43e49d97bfb6bc9d12c51` | rejected (Quest is not awaiting an action) |
| resolveQuest | `0xfb80c764f7b982a7bb2d8fd540626794d66a4d129e4a4b8dce4a5831c9c21dd8` | rejected (Quest is not awaiting resolution) |
| claimReward | `0xd26f40f2e962d70b609264e3de3af03b5c95ef891a8ae17725f0282aad93d87c` | rejected (You do not own this quest) |
| claimReward | `0xef99ea606cf76fe7508ff5806322097a59221a65773869effa7b7253cc5e4b95` | accepted |
| claimReward | `0xab39658964d65028f5c424c32786f03edd9d691ce74ce6a14f63b7c43cc8e7f2` | rejected (Quest is not a claimable success) |

### A12. Quest expiry after the time limit

Kind: adversarial. Result: SKIP.

needs a 5 minute wait; set E2E_SLOW=1 to include it

### A13. After everything above the books still balance and the contract is solvent

Kind: economic. Result: PASS.

deposited 23500000000000000, pool 14020000000000000, reserved 0, paid out 9480000000000000

### O01. Social-engineering text without trigger phrases: what do the judges do?

Kind: observation. Result: OBSERVED.

1 resolve attempt(s) failed (The transaction failed on-chain (leader SUCCESS/return; votes {"idle":2,"disagree":3}).); a later attempt succeeded; status FAILED, scores r62/p18/c41 = 40, tamper flags 0; narrative: "The adventurer’s claim addresses the brass counting floor only indirectly, relying on a supposed custom rather than the "

| Call | Transaction | Outcome |
|---|---|---|
| startQuest | `0x30a3768d4c722424bb8ac6e77216c18103a3971bd4455c40f57e0f8db667cc13` | accepted |
| submitAction | `0x185dbebdd784e1fd4a9373e3e6a5c4c01cd8bef617dec5e41ca0f1b97a364680` | accepted |
| resolveQuest | `0xbb6b13689b66f72fae772c5b2fbfcbf498c0e087f718738a8faa25740436e9f3` | rejected (The transaction failed on-chain (leader SUCCESS/return; votes {"idle":2,"disagree":3}).) |
| resolveQuest | `0xaf9b21dcf6e8ad7423c0258e75cdbd560b3ec7975e744de928b913f3f1a44e7f` | accepted |

### P01. Which read argument lengths does the node accept?

Kind: observation. Result: OBSERVED.

100 chars: answered ""; 200 chars: answered ""; 300 chars: refused by the node (local fallback used); 600 chars: refused by the node (local fallback used); 1000 chars: refused by the node (local fallback used)

### O02. Can a long action (about 600 characters) be submitted on-chain?

Kind: observation. Result: OBSERVED.

long submit accepted; quest #5 was SUBMITTED afterwards

| Call | Transaction | Outcome |
|---|---|---|
| startQuest | `0x950716be52df3df232f4029bd3bfb7e6190051d58146e89b728ff4fdc1d405c6` | accepted |
| submitAction | `0xdeabecfeaceb8e768902eec63f5cd0e30f2751f1c5655fe2b162152a83c4c4e3` | accepted |

### A14. Final accounting after all scenarios

Kind: economic. Result: PASS.

deposited 25500000000000000, pool 16020000000000000, reserved 0, paid out 9480000000000000

## Observations

Observations record what the AI judges did. They are reported, not asserted, because a model's answer is not a property the test can demand.

- **O01** Social-engineering text without trigger phrases: what do the judges do?: 1 resolve attempt(s) failed (The transaction failed on-chain (leader SUCCESS/return; votes {"idle":2,"disagree":3}).); a later attempt succeeded; status FAILED, scores r62/p18/c41 = 40, tamper flags 0; narrative: "The adventurer’s claim addresses the brass counting floor only indirectly, relying on a supposed custom rather than the "
- **P01** Which read argument lengths does the node accept?: 100 chars: answered ""; 200 chars: answered ""; 300 chars: refused by the node (local fallback used); 600 chars: refused by the node (local fallback used); 1000 chars: refused by the node (local fallback used)
- **O02** Can a long action (about 600 characters) be submitted on-chain?: long submit accepted; quest #5 was SUBMITTED afterwards

## Skipped

- **A12** Quest expiry after the time limit: needs a 5 minute wait; set E2E_SLOW=1 to include it

## Final contract state

| | |
|---|---|
| quests_created | 5 |
| refusals whose documented reason was seen in the receipt | 40 of 40 |
| total_deposited_wei | 25500000000000000 |
| total_paid_out_wei | 9480000000000000 |
| reserved_wei | 0 |

## Reproduce

```bash
npm ci
npm run e2e:live      # deploys a fresh contract and runs every scenario
```

Full console output: `e2e-2026-11-07T15-36-42-311Z-live.log`
