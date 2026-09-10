"""
Focused regression tests for the Steward-requested fixes:

1. A successful quest must stay discoverable via `get_player_active_quest`
   after `resolve_quest` runs (including "after a refresh" - simulated
   here by never relying on anything except fresh reads from the
   contract), so the client always has an id to pass to `claim_reward`.

2. `reward_pool` must be reserved (deducted) the moment a reward is
   *recorded* at resolution time, not deferred to `claim_reward` - so the
   pool can never be oversubscribed by several pending, unclaimed
   successful quests.

Run with:
    pip install genlayer-test
    pytest tests/ -v
"""

from pathlib import Path

CONTRACT_PATH = str(Path(__file__).parent.parent / "contracts" / "GenDungeon.py")

STATUS_ACTIVE = 0
STATUS_SUBMITTED = 1
STATUS_SUCCESS = 2
STATUS_FAILED = 3
STATUS_CLAIMED = 4

# Deliberately small, round numbers - not realistic wei amounts - purely
# so reward arithmetic is easy to verify by hand in assertions.
ENTRY_FEE = 60
MIN_REWARD = 20
MAX_REWARD = 100  # span = 80, so creativity_score=100 -> reward=100 (uncapped)

SCENARIO_PROMPT_MARKER = r"invent ONE short"
EVALUATE_PROMPT_MARKER = r"judging a player's"


def _mock_scenario(vm, scenario="A collapsing rope bridge blocks the only path forward.", difficulty="medium"):
    vm.mock_llm(
        SCENARIO_PROMPT_MARKER,
        f'{{"scenario": "{scenario}", "difficulty": "{difficulty}"}}',
    )


def _mock_evaluation(vm, success: bool, creativity_score: int, narrative="The attempt is judged."):
    vm.mock_llm(
        EVALUATE_PROMPT_MARKER,
        f'{{"success": {"true" if success else "false"}, '
        f'"creativity_score": {creativity_score}, "narrative": "{narrative}"}}',
    )


def _deploy(direct_deploy):
    # genlayer-test's auto-detected "latest" genvm release (v0.3.0-rc*)
    # renamed its release asset and no longer ships `genvm-universal.tar.xz`,
    # which this version of genlayer-test still expects - pin to the last
    # release that has it so `pip install genlayer-test && pytest` keeps
    # working without needing a matching genlayer-test upgrade.
    return direct_deploy(
        CONTRACT_PATH, ENTRY_FEE, MIN_REWARD, MAX_REWARD, sdk_version="v0.2.16"
    )


def _addr_str(addr) -> str:
    """
    Fixture addresses (direct_alice, direct_bob, ...) are plain `bytes`
    until genlayer's SDK path has been added to sys.path, which only
    happens once a contract is deployed in this process - so build a real
    Address (valid any time after the first `_deploy()` call in a test)
    to get the exact hex string the contract's own `Address(player: str)`
    parsing expects, instead of stringifying raw bytes.
    """
    from genlayer.py.types import Address

    return str(addr if isinstance(addr, Address) else Address(addr))


def _start_quest(vm, contract, player) -> int:
    vm.sender = player
    vm.value = ENTRY_FEE
    quest_id = contract.start_quest()
    vm.value = 0
    return int(quest_id)


def _submit(vm, contract, player, quest_id, action="I carefully test each plank before crossing."):
    vm.sender = player
    contract.submit_action(quest_id, action)


# ---------------------------------------------------------------------
# 1. Resolve -> claim: discoverability across a "refresh"
# ---------------------------------------------------------------------

def test_resolve_then_claim_end_to_end(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = _deploy(direct_deploy)

    # Fund the pool generously up front so a max-creativity reward is
    # fully payable without hitting the pool cap.
    direct_vm.sender = direct_alice
    direct_vm.value = 200
    contract.fund_pool()
    direct_vm.value = 0

    _mock_scenario(direct_vm)
    _mock_evaluation(direct_vm, success=True, creativity_score=100)

    quest_id = _start_quest(direct_vm, contract, direct_alice)
    _submit(direct_vm, contract, direct_alice, quest_id)

    direct_vm.sender = direct_bob  # keeper-style resolution by a third party
    assert contract.resolve_quest(quest_id) is True

    pool_after_resolve = int(contract.get_config().reward_pool)

    # Discoverable via a fresh read, exactly as a client would after a
    # page refresh with no other local state to fall back on.
    assert int(contract.get_player_active_quest(_addr_str(direct_alice))) == quest_id

    quest = contract.get_quest(quest_id)
    assert int(quest.status) == STATUS_SUCCESS
    reward = int(quest.reward)
    assert reward == 100
    assert pool_after_resolve == 200 + ENTRY_FEE - reward  # reserved already

    direct_vm.sender = direct_alice
    paid_out = int(contract.claim_reward(quest_id))
    assert paid_out == reward

    claimed_quest = contract.get_quest(quest_id)
    assert int(claimed_quest.status) == STATUS_CLAIMED

    # Slot freed only now - claiming is what finally clears it.
    assert int(contract.get_player_active_quest(_addr_str(direct_alice))) == 0

    # Pool must NOT be touched a second time by claim_reward.
    assert int(contract.get_config().reward_pool) == pool_after_resolve

    stats = contract.get_player_stats(_addr_str(direct_alice))
    assert int(stats.total_rewards_earned) == reward
    assert int(stats.quests_succeeded) == 1


def test_cannot_claim_the_same_quest_twice(direct_vm, direct_deploy, direct_alice):
    contract = _deploy(direct_deploy)
    direct_vm.sender = direct_alice
    direct_vm.value = 200
    contract.fund_pool()
    direct_vm.value = 0

    _mock_scenario(direct_vm)
    _mock_evaluation(direct_vm, success=True, creativity_score=50)

    quest_id = _start_quest(direct_vm, contract, direct_alice)
    _submit(direct_vm, contract, direct_alice, quest_id)
    contract.resolve_quest(quest_id)

    direct_vm.sender = direct_alice
    contract.claim_reward(quest_id)

    with direct_vm.expect_revert("not a claimable success"):
        contract.claim_reward(quest_id)


# ---------------------------------------------------------------------
# 2. Reward reservation: the pool must cover every pending claim
# ---------------------------------------------------------------------

def test_simultaneous_successful_quests_are_both_fully_payable(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    """
    Two players each resolve a successful quest *before either claims*.
    The pool (2x ENTRY_FEE = 120) cannot cover two uncapped 100-GEN
    rewards (200 total) - so this also exercises `_compute_reward`'s cap
    interacting correctly with reservation:

      - alice resolves first: pool is 120, reward is capped at
        min(100, 120) = 100, reserved -> pool becomes 20.
      - bob resolves second: pool is now only 20, so his reward is
        capped at min(100, 20) = 20, reserved -> pool becomes 0.

    Without reserving at resolution time, both quests would have been
    independently capped against the *same* undiminished 120-pool and
    each recorded a reward of 100 (200 total promised against only 120
    available) - bob's later claim would then fail with "Reward pool
    inconsistency" even though his quest genuinely recorded a success.
    """
    contract = _deploy(direct_deploy)
    _mock_scenario(direct_vm)
    _mock_evaluation(direct_vm, success=True, creativity_score=100)

    alice_quest = _start_quest(direct_vm, contract, direct_alice)
    bob_quest = _start_quest(direct_vm, contract, direct_bob)
    assert int(contract.get_config().reward_pool) == ENTRY_FEE * 2  # 120

    _submit(direct_vm, contract, direct_alice, alice_quest)
    _submit(direct_vm, contract, direct_bob, bob_quest)

    direct_vm.sender = direct_alice
    assert contract.resolve_quest(alice_quest) is True
    pool_after_alice = int(contract.get_config().reward_pool)
    assert pool_after_alice == 20

    direct_vm.sender = direct_bob
    assert contract.resolve_quest(bob_quest) is True
    pool_after_bob = int(contract.get_config().reward_pool)
    assert pool_after_bob == 0

    alice_reward = int(contract.get_quest(alice_quest).reward)
    bob_reward = int(contract.get_quest(bob_quest).reward)
    assert alice_reward == 100
    assert bob_reward == 20  # correctly capped by the *already-reserved* pool
    assert alice_reward + bob_reward == ENTRY_FEE * 2  # every GEN accounted for

    # Both are simultaneously discoverable, independently, per player.
    assert int(contract.get_player_active_quest(_addr_str(direct_alice))) == alice_quest
    assert int(contract.get_player_active_quest(_addr_str(direct_bob))) == bob_quest

    # Both must be fully claimable for their *recorded* amount - this is
    # the crux of the regression check: neither claim should ever raise
    # "Reward pool inconsistency", regardless of claim order.
    direct_vm.sender = direct_bob
    assert int(contract.claim_reward(bob_quest)) == bob_reward

    direct_vm.sender = direct_alice
    assert int(contract.claim_reward(alice_quest)) == alice_reward

    assert int(contract.get_config().reward_pool) == 0


# ---------------------------------------------------------------------
# Adjacent guardrails for the same invariant
# ---------------------------------------------------------------------

def test_failed_quest_reserves_nothing_and_frees_the_slot_immediately(
    direct_vm, direct_deploy, direct_alice
):
    contract = _deploy(direct_deploy)
    _mock_scenario(direct_vm)
    _mock_evaluation(direct_vm, success=False, creativity_score=10, narrative="The bridge gives way.")

    quest_id = _start_quest(direct_vm, contract, direct_alice)
    pool_before = int(contract.get_config().reward_pool)

    _submit(direct_vm, contract, direct_alice, quest_id)
    direct_vm.sender = direct_alice
    assert contract.resolve_quest(quest_id) is False

    quest = contract.get_quest(quest_id)
    assert int(quest.status) == STATUS_FAILED
    assert int(quest.reward) == 0
    assert int(contract.get_config().reward_pool) == pool_before  # nothing reserved

    # Nothing pending - the slot is freed right away, no claim needed.
    assert int(contract.get_player_active_quest(_addr_str(direct_alice))) == 0

    # And the player can immediately start a new quest.
    next_quest_id = _start_quest(direct_vm, contract, direct_alice)
    assert next_quest_id != quest_id


def test_start_quest_blocked_while_a_success_is_unclaimed(direct_vm, direct_deploy, direct_alice):
    contract = _deploy(direct_deploy)
    direct_vm.sender = direct_alice
    direct_vm.value = 200
    contract.fund_pool()
    direct_vm.value = 0

    _mock_scenario(direct_vm)
    _mock_evaluation(direct_vm, success=True, creativity_score=50)

    quest_id = _start_quest(direct_vm, contract, direct_alice)
    _submit(direct_vm, contract, direct_alice, quest_id)
    direct_vm.sender = direct_alice
    contract.resolve_quest(quest_id)

    # A recorded, unclaimed reward is waiting - starting a fresh quest
    # must be blocked, or its id would silently overwrite the only
    # pointer to the unclaimed reward.
    direct_vm.sender = direct_alice
    direct_vm.value = ENTRY_FEE
    with direct_vm.expect_revert("resolve or claim it"):
        contract.start_quest()
    direct_vm.value = 0

    # Claim it, and starting a new quest works again.
    direct_vm.sender = direct_alice
    contract.claim_reward(quest_id)

    new_quest_id = _start_quest(direct_vm, contract, direct_alice)
    assert new_quest_id != quest_id
    assert int(contract.get_player_active_quest(_addr_str(direct_alice))) == new_quest_id
