# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""
AI-Generated Dungeon Master & Role-Playing Game (GenDungeon)
============================================================

An Intelligent Contract for the GenLayer platform (Testnet genlayer studio) that acts
as an autonomous AI Dungeon Master.

Game loop
---------
1. `start_quest`        (payable) - player pays an entry fee, the contract's
                                    reward pool grows, and non-deterministic
                                    AI consensus generates a unique narrative
                                    obstacle for the player.
2. `submit_action`      (write)   - player submits free-text describing how
                                    they attempt to overcome the obstacle.
3. `resolve_quest`      (write)   - AI validators reach consensus on whether
                                    the action was logical/creative enough to
                                    succeed, and how large a reward it earns.
4. `claim_reward`       (write)   - successful players withdraw their reward
                                    from the pool using the Checks-Effects-
                                    Interactions (CEI) pattern.
5. `surrender_quest`    (write)   - allows a player to forfeit an active quest,
                                    marking it as failed and freeing their slot.

Design notes
------------
* All persistent structured records (`Quest`, `PlayerStats`) are flat
  `@allow_storage @dataclass` objects using only primitive / Address / sized
  integer / bool / str fields, as required by GenLayer storage rules.
* View-only return dataclasses (`ConfigView`, `QuestView`, `PlayerStatsView`,
  `QuestHistoryView`, `ActiveQuestView`) are ALSO decorated with
  `@allow_storage`, even though they are never persisted. Every official
  GenLayer example that returns a custom class instance from a method uses
  `@allow_storage`, which strongly suggests GenVM's calldata encoder relies
  on it to serialize custom object instances across the call boundary - not
  just for chain storage. Skipping it risks a runtime encoding error the
  first time one of these view methods is actually called.
* `DynArray` / `TreeMap` fields are declared only via type annotation and are
  never manually instantiated (e.g. no `TreeMap()` calls) - GenLayer
  lazy-initializes them.
* Player quest history is derived on-demand by scanning `quests` (bounded by
  `quest_counter`) rather than maintaining a nested `TreeMap[Address,
  DynArray[u32]]`, since dataclass storage fields must stay flat and nesting
  dynamic containers inside map values is avoided for safety/portability.
* Every AI call goes through `gl.vm.run_nondet_unsafe` (or the safe
  convenience wrapper) with an explicit leader/validator pair so the network
  reaches Optimistic-Democracy consensus on non-deterministic LLM output
  before any state mutation happens.
* All view methods are wrapped in try/except and return safe empty defaults
  on malformed input, per GenLayer best practice.
* External value transfers (GEN tokens) are safely executed via the
  `_Recipient` EVM interface according to GenLayer documentation.
"""

from genlayer import *
from dataclasses import dataclass


# ==========================================================================
# Interface for External Value Transfers (EVM Layer)
# Used for safe pull-payments to Externally Owned Accounts (EOAs).
# ==========================================================================
@gl.evm.contract_interface
class _Recipient:
    class View:
        pass
    class Write:
        pass


# ==========================================================================
# Quest status codes (kept as plain u32 constants - GenLayer storage favors
# primitive fields over enums inside flat dataclasses)
# ==========================================================================
STATUS_ACTIVE: u32 = u32(0)      # Scenario generated, awaiting player action
STATUS_SUBMITTED: u32 = u32(1)   # Action submitted, awaiting AI resolution
STATUS_SUCCESS: u32 = u32(2)     # AI ruled success, reward pending claim
STATUS_FAILED: u32 = u32(3)      # AI ruled failure, no reward
STATUS_CLAIMED: u32 = u32(4)     # Reward already paid out


# ==========================================================================
# Storage Dataclasses - flat layout only
# ==========================================================================
@allow_storage
@dataclass
class Quest:
    """A single quest instance tied to one player."""
    quest_id: u32
    player: Address
    scenario: str
    action: str
    status: u32
    creativity_score: u32
    reward: u256
    narrative_outcome: str


@allow_storage
@dataclass
class PlayerStats:
    """Aggregate lifetime statistics for a player."""
    quests_started: u32
    quests_succeeded: u32
    quests_failed: u32
    total_rewards_earned: u256


# ==========================================================================
# View (Non-Storage) Dataclasses
# Used exclusively for returning structured data safely in View methods.
# Decorated with @allow_storage so GenVM's calldata encoder can serialize
# them across the WASM boundary, matching every custom-class example in the
# official GenLayer docs (see design notes above).
# ==========================================================================
@allow_storage
@dataclass
class ConfigView:
    entry_fee: u256
    min_reward: u256
    max_reward: u256
    reward_pool: u256
    total_quests_created: u32


@allow_storage
@dataclass
class QuestView:
    quest_id: u32
    player: str
    scenario: str
    action: str
    status: u32
    status_label: str
    creativity_score: u32
    reward: u256
    narrative_outcome: str


@allow_storage
@dataclass
class PlayerStatsView:
    quests_started: u32
    quests_succeeded: u32
    quests_failed: u32
    total_rewards_earned: u256


@allow_storage
@dataclass
class QuestHistoryView:
    quest_id: u32
    status: u32
    status_label: str
    creativity_score: u32
    reward: u256


@allow_storage
@dataclass
class ActiveQuestView:
    quest_id: u32
    player: str
    scenario: str
    status: u32
    status_label: str


class GenDungeon(gl.Contract):
    """
    The AI Dungeon Master Intelligent Contract (GenDungeon).

    Holds the reward pool, the registry of all quests ever created, and
    per-player aggregate statistics. All narrative generation and action
    judging is delegated to non-deterministic LLM calls validated through
    GenLayer's Optimistic Democracy consensus mechanism.
    """

    # ---- Persistent state (type-annotated only; GenLayer lazy-inits) ----
    owner: Address
    entry_fee: u256
    min_reward: u256
    max_reward: u256
    reward_pool: u256
    quest_counter: u32

    quests: TreeMap[u32, Quest]
    player_active_quest: TreeMap[Address, u32]
    player_stats: TreeMap[Address, PlayerStats]

    def __init__(self, entry_fee: u256, min_reward: u256, max_reward: u256):
        """
        Deploy the Dungeon Master.

        Args:
            entry_fee:  Minimum native-token amount a player must pay to
                        start a quest. Fully added to the reward pool.
            min_reward: Smallest possible reward paid out on a successful
                        quest.
            max_reward: Largest possible reward paid out on a maximally
                        creative, successful quest.

        Raises:
            gl.vm.UserError: if min_reward exceeds max_reward.
        """
        if int(min_reward) > int(max_reward):
            raise gl.vm.UserError("min_reward cannot exceed max_reward")

        self.owner = gl.message.sender_address
        self.entry_fee = u256(entry_fee)
        self.min_reward = u256(min_reward)
        self.max_reward = u256(max_reward)
        self.reward_pool = u256(0)
        self.quest_counter = u32(0)
        # NOTE: quests / player_active_quest / player_stats are TreeMap
        # fields - left untouched here; GenLayer lazy-initializes them.

    # ======================================================================
    # Internal helpers
    # ======================================================================
    def _get_stats(self, player: Address) -> PlayerStats:
        """Return a player's stats record, creating a zeroed one if absent."""
        if player in self.player_stats:
            return self.player_stats[player]
        fresh = PlayerStats(
            quests_started=u32(0),
            quests_succeeded=u32(0),
            quests_failed=u32(0),
            total_rewards_earned=u256(0),
        )
        self.player_stats[player] = fresh
        return fresh

    def _generate_scenario(self) -> tuple[str, str]:
        """
        Ask AI validators to jointly agree on a fresh dungeon scenario.

        Uses `run_nondet_unsafe` with an explicit validator so all
        participating nodes converge on structurally-valid JSON before the
        leader's text is accepted into consensus state. The validator
        re-runs the leader function independently (rather than only asking
        a loosely-scoped "does this look valid?" question) so it is
        producing its own evidence, not merely rubber-stamping the leader's
        formatting.

        Returns:
            (scenario_text, difficulty_hint) tuple.
        """
        # Read deterministic variables safely outside the non-deterministic block
        player_addr = str(gl.message.sender_address)
        tx_time = gl.message_raw['datetime']

        prompt = (
            "You are an AI Dungeon Master for a text-based fantasy RPG. "
            f"For the player {player_addr} at time {tx_time}, "
            "invent ONE short, unique obstacle or scenario (2-4 sentences) that this lone adventurer must overcome right now. "
            "Make it vivid, specific, and totally different from generic tropes or previous scenarios. "
            "Respond ONLY with strict JSON in the exact shape: "
            '{"scenario": "<string>", "difficulty": "<easy|medium|hard>"}'
        )

        def leader_fn():
            return gl.nondet.exec_prompt(prompt, response_format="json")

        def _is_well_formed(data) -> bool:
            if not isinstance(data, dict):
                return False
            if "scenario" not in data or "difficulty" not in data:
                return False
            scenario_text = str(data["scenario"]).strip()
            difficulty = str(data["difficulty"]).strip().lower()
            if len(scenario_text) < 10 or len(scenario_text) > 1000:
                return False
            if difficulty not in ("easy", "medium", "hard"):
                return False
            return True

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            data = leader_result.calldata

            if not _is_well_formed(data):
                return False

            # Independently re-run the same generation task rather than only
            # judging the leader's output in isolation. We do not require the
            # two scenarios to match (creative text will always differ), but
            # we do require the validator's own independently generated
            # scenario to ALSO be well-formed under the exact same schema
            # rules - giving the validator its own evidence instead of only
            # trusting the leader's self-report.
            validator_data = leader_fn()
            return _is_well_formed(validator_data)

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        scenario_text = str(result["scenario"]).strip()
        difficulty = str(result["difficulty"]).strip()
        return scenario_text, difficulty

    def _evaluate_action(self, scenario: str, action: str) -> tuple[bool, u32, str]:
        """
        Ask AI validators to jointly judge whether the player's free-text
        action logically and creatively resolves the given scenario.

        Returns:
            (success, creativity_score[0-100], narrative_outcome) tuple.
        """

        def leader_fn():
            prompt = (
                "You are an impartial AI Dungeon Master judging a player's "
                "attempt to overcome an obstacle in a text RPG.\n\n"
                f"Scenario: {scenario}\n\n"
                f"Player's action: {action}\n\n"
                "Decide if the action is logical, plausible within the "
                "scenario, and creatively resolves the obstacle. Be fair "
                "but not lenient - vague, nonsensical, or off-topic actions "
                "should fail. Respond ONLY with strict JSON in the exact "
                'shape: {"success": <true|false>, "creativity_score": '
                '<integer 0-100>, "narrative": "<short 1-2 sentence outcome '
                'description>"}.'
            )
            return gl.nondet.exec_prompt(prompt, response_format="json")

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            data = leader_result.calldata

            if not isinstance(data, dict):
                return False
            if "success" not in data or "creativity_score" not in data or "narrative" not in data:
                return False

            # Validator independently evaluates the action by re-running the leader function
            validator_data = leader_fn()

            # 1. Partial Field Matching: The core decision (success) must match exactly
            if bool(data["success"]) != bool(validator_data.get("success")):
                return False

            # 2. Numeric Tolerance: Creativity scores from LLMs vary, allow +/-15 tolerance
            try:
                leader_score = int(data["creativity_score"])
                val_score = int(validator_data.get("creativity_score", 0))
            except (ValueError, TypeError):
                return False

            return abs(leader_score - val_score) <= 15

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        success = bool(result.get("success", False))

        # Safely parse and clamp the creativity score
        try:
            raw_score = int(result.get("creativity_score", 0))
        except (ValueError, TypeError):
            raw_score = 0

        raw_score = max(0, min(100, raw_score))
        creativity_score = u32(raw_score)
        narrative = str(result.get("narrative", "")).strip()

        return success, creativity_score, narrative

    def _compute_reward(self, creativity_score: u32) -> u256:
        """Linearly scale reward between min_reward and max_reward based on
        the creativity score (0-100), capped by the available pool."""
        score = int(creativity_score)
        span = int(self.max_reward) - int(self.min_reward)
        if span < 0:
            span = 0
        bonus = (span * score) // 100
        reward = int(self.min_reward) + bonus

        # Ensure we do not pay out more than what is available in the pool
        if reward > int(self.reward_pool):
            reward = int(self.reward_pool)
        if reward < 0:
            reward = 0

        return u256(reward)

    # ======================================================================
    # Write methods
    # ======================================================================
    @gl.public.write.payable
    def start_quest(self) -> u32:
        """
        Pay the entry fee to begin a new quest. Generates a unique AI
        narrative obstacle via validator consensus.

        Raises:
            gl.vm.UserError: if payment is insufficient or the player
                              already has an unresolved quest in progress.

        Returns:
            The new quest's id.
        """
        player = gl.message.sender_address
        paid = u256(gl.message.value)

        if paid < self.entry_fee:
            raise gl.vm.UserError(
                f"Insufficient entry fee: sent {int(paid)}, "
                f"required {int(self.entry_fee)}"
            )

        if player in self.player_active_quest:
            active_id = int(self.player_active_quest[player])
            if active_id != 0 and active_id in self.quests:
                existing = self.quests[u32(active_id)]
                if existing.status in (STATUS_ACTIVE, STATUS_SUBMITTED):
                    raise gl.vm.UserError(
                        "You already have an unresolved quest in progress"
                    )

        # --- Non-deterministic AI generation (consensus-validated) ---
        print(f"[GenDungeon] Generating scenario for player {player}...")
        scenario_text, _difficulty = self._generate_scenario()
        print(f"[GenDungeon] Scenario generated. Difficulty: {_difficulty}")

        # --- Deterministic state mutation after consensus ---
        self.reward_pool = u256(int(self.reward_pool) + int(paid))
        self.quest_counter = u32(int(self.quest_counter) + 1)
        new_id = self.quest_counter

        quest = Quest(
            quest_id=new_id,
            player=player,
            scenario=scenario_text,
            action="",
            status=STATUS_ACTIVE,
            creativity_score=u32(0),
            reward=u256(0),
            narrative_outcome="",
        )
        self.quests[new_id] = quest
        self.player_active_quest[player] = new_id

        stats = self._get_stats(player)
        stats.quests_started = u32(int(stats.quests_started) + 1)
        self.player_stats[player] = stats

        print(f"[GenDungeon] Quest #{int(new_id)} successfully started for {player}")
        return new_id

    @gl.public.write
    def submit_action(self, quest_id: u32, action: str) -> None:
        """
        Submit a free-text action describing how the player attempts to
        overcome their active quest's obstacle.

        Args:
            quest_id: The quest to act on.
            action:   Free-text description of the player's action.

        Raises:
            gl.vm.UserError: on invalid quest id, wrong owner, wrong status,
                              or empty action text.
        """
        quest_id = u32(quest_id)
        action = str(action).strip()
        caller = gl.message.sender_address

        if quest_id not in self.quests:
            raise gl.vm.UserError("Quest does not exist")

        quest = self.quests[quest_id]

        if quest.player != caller:
            raise gl.vm.UserError("You do not own this quest")

        if quest.status != STATUS_ACTIVE:
            raise gl.vm.UserError("Quest is not awaiting an action")

        if len(action) == 0:
            raise gl.vm.UserError("Action text must not be empty")

        if len(action) > 2000:
            raise gl.vm.UserError("Action text is too long (max 2000 chars)")

        quest.action = action
        quest.status = STATUS_SUBMITTED
        self.quests[quest_id] = quest

        print(f"[GenDungeon] Action submitted for quest #{int(quest_id)}")

    @gl.public.write
    def surrender_quest(self) -> None:
        """
        Allow a player to give up their active quest and free their slot.
        The entry fee is forfeited and remains in the reward pool.
        """
        caller = gl.message.sender_address

        if caller not in self.player_active_quest:
            raise gl.vm.UserError("You do not have an active quest")

        active_id = self.player_active_quest[caller]
        if int(active_id) == 0:
            raise gl.vm.UserError("You do not have an active quest")

        quest = self.quests[active_id]

        # The player can only surrender if the quest hasn't been submitted/resolved yet
        if quest.status != STATUS_ACTIVE:
            raise gl.vm.UserError("Quest is currently being resolved or already finished")

        quest.status = STATUS_FAILED
        quest.narrative_outcome = "The adventurer fled from the challenge in terror."
        self.quests[active_id] = quest

        stats = self._get_stats(caller)
        stats.quests_failed = u32(int(stats.quests_failed) + 1)
        self.player_stats[caller] = stats

        # Free the active quest slot
        self.player_active_quest[caller] = u32(0)

        print(f"[GenDungeon] Quest #{int(active_id)} surrendered by {caller}")

    @gl.public.write
    def resolve_quest(self, quest_id: u32) -> bool:
        """
        Trigger AI-validator consensus to judge the submitted action and
        resolve the quest to success or failure.

        Callable by anyone (keeper-style), not just the quest owner - the
        outcome depends only on the quest's stored scenario/action content,
        not on who triggers resolution, so this is intentionally open to
        avoid quests getting stuck if a player never calls back in.

        Args:
            quest_id: The quest to resolve.

        Raises:
            gl.vm.UserError: on invalid quest id or wrong status.

        Returns:
            True if the quest succeeded, False otherwise.
        """
        quest_id = u32(quest_id)

        if quest_id not in self.quests:
            raise gl.vm.UserError("Quest does not exist")

        quest = self.quests[quest_id]

        if quest.status != STATUS_SUBMITTED:
            raise gl.vm.UserError("Quest is not awaiting resolution")

        # --- Non-deterministic AI judging (consensus-validated) ---
        print(f"[GenDungeon] Resolving action for quest #{int(quest_id)}...")
        success, creativity_score, narrative = self._evaluate_action(
            quest.scenario, quest.action
        )

        # --- Deterministic state mutation after consensus ---
        stats = self._get_stats(quest.player)

        if success:
            reward = self._compute_reward(creativity_score)
            quest.status = STATUS_SUCCESS
            quest.reward = reward
            stats.quests_succeeded = u32(int(stats.quests_succeeded) + 1)
        else:
            quest.status = STATUS_FAILED
            quest.reward = u256(0)
            stats.quests_failed = u32(int(stats.quests_failed) + 1)

        quest.creativity_score = creativity_score
        quest.narrative_outcome = narrative
        self.quests[quest_id] = quest
        self.player_stats[quest.player] = stats

        # Free up the player's "active quest" slot regardless of outcome.
        if quest.player in self.player_active_quest:
            self.player_active_quest[quest.player] = u32(0)

        print(
            f"[GenDungeon] Quest #{int(quest_id)} resolved: "
            f"success={success}, creativity={int(creativity_score)}"
        )
        return success

    @gl.public.write
    def claim_reward(self, quest_id: u32) -> u256:
        """
        Claim the reward for a successfully resolved quest.

        Implements the Checks-Effects-Interactions pattern: all validation
        and state mutation happens BEFORE the outgoing value transfer, to
        prevent re-entrancy style exploits.

        Args:
            quest_id: The quest to claim the reward for.

        Raises:
            gl.vm.UserError: on invalid quest id, wrong owner, wrong status,
                              or an inconsistent reward pool.

        Returns:
            The amount transferred to the caller.
        """
        quest_id = u32(quest_id)
        caller = gl.message.sender_address

        # ---------------------------- CHECKS ----------------------------
        if quest_id not in self.quests:
            raise gl.vm.UserError("Quest does not exist")

        quest = self.quests[quest_id]

        if quest.player != caller:
            raise gl.vm.UserError("You do not own this quest")

        if quest.status != STATUS_SUCCESS:
            raise gl.vm.UserError("Quest is not a claimable success")

        reward = quest.reward
        if int(reward) <= 0:
            raise gl.vm.UserError("No reward available to claim")

        if int(reward) > int(self.reward_pool):
            raise gl.vm.UserError("Reward pool inconsistency - contact owner")

        # --------------------------- EFFECTS ----------------------------
        quest.status = STATUS_CLAIMED
        self.quests[quest_id] = quest
        self.reward_pool = u256(int(self.reward_pool) - int(reward))

        stats = self._get_stats(caller)
        stats.total_rewards_earned = u256(
            int(stats.total_rewards_earned) + int(reward)
        )
        self.player_stats[caller] = stats

        # ------------------------- INTERACTIONS --------------------------
        # Transmit the native GEN token securely to the EOA layer.
        # Enforcing on='finalized' ensures funds are transferred only when
        # the transaction is fully settled on the consensus layer.
        _Recipient(caller).emit_transfer(value=reward, on='finalized')

        print(
            f"[GenDungeon] Quest #{int(quest_id)} reward "
            f"{int(reward)} claimed by {caller}"
        )
        return reward

    @gl.public.write.payable
    def fund_pool(self) -> None:
        """Allow anyone (e.g. the owner or sponsors) to top up the reward
        pool without starting a quest."""
        val = u256(gl.message.value)
        if val == u256(0):
            raise gl.vm.UserError("Send some value to fund the pool")
        self.reward_pool = u256(int(self.reward_pool) + int(val))
        print(f"[GenDungeon] Pool topped up by {int(val)}")

    @gl.public.write
    def set_fee_and_rewards(
        self, entry_fee: u256, min_reward: u256, max_reward: u256
    ) -> None:
        """Owner-only: tune the economic parameters of the dungeon."""
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("Only the owner can change these parameters")
        if int(min_reward) > int(max_reward):
            raise gl.vm.UserError("min_reward cannot exceed max_reward")
        self.entry_fee = u256(entry_fee)
        self.min_reward = u256(min_reward)
        self.max_reward = u256(max_reward)
        print("[GenDungeon] Economic parameters successfully updated by owner.")

    # ======================================================================
    # View methods - all wrapped in try/except, returning safe defaults
    # ======================================================================
    @gl.public.view
    def get_owner(self) -> str:
        """Return the contract owner's address as a string, or "" on error."""
        try:
            return str(self.owner)
        except Exception:
            return ""

    @gl.public.view
    def get_config(self) -> ConfigView:
        """Return the current economic configuration safely."""
        try:
            return ConfigView(
                entry_fee=self.entry_fee,
                min_reward=self.min_reward,
                max_reward=self.max_reward,
                reward_pool=self.reward_pool,
                total_quests_created=self.quest_counter,
            )
        except Exception:
            return ConfigView(u256(0), u256(0), u256(0), u256(0), u32(0))

    @gl.public.view
    def get_quest(self, quest_id: u32) -> QuestView:
        """
        Safely inspect a single quest.
        Returns an empty QuestView if the quest does not exist or the input is
        malformed - never raises to the caller.
        """
        try:
            qid = u32(quest_id)
            if qid not in self.quests:
                return QuestView(u32(0), "", "", "", u32(0), "", u32(0), u256(0), "")
            q = self.quests[qid]
            return QuestView(
                quest_id=q.quest_id,
                player=str(q.player),
                scenario=q.scenario,
                action=q.action,
                status=q.status,
                status_label=self._status_label(q.status),
                creativity_score=q.creativity_score,
                reward=q.reward,
                narrative_outcome=q.narrative_outcome,
            )
        except Exception:
            return QuestView(u32(0), "", "", "", u32(0), "", u32(0), u256(0), "")

    @gl.public.view
    def get_player_active_quest(self, player: str) -> u32:
        """Return the active quest id for a player, or 0 if none / on error."""
        try:
            addr = Address(player)
            if addr not in self.player_active_quest:
                return u32(0)
            return self.player_active_quest[addr]
        except Exception:
            return u32(0)

    @gl.public.view
    def get_player_stats(self, player: str) -> PlayerStatsView:
        """Safely return a player's aggregate statistics."""
        try:
            addr = Address(player)
            if addr not in self.player_stats:
                return PlayerStatsView(u32(0), u32(0), u32(0), u256(0))
            s = self.player_stats[addr]
            return PlayerStatsView(
                quests_started=s.quests_started,
                quests_succeeded=s.quests_succeeded,
                quests_failed=s.quests_failed,
                total_rewards_earned=s.total_rewards_earned,
            )
        except Exception:
            return PlayerStatsView(u32(0), u32(0), u32(0), u256(0))

    @gl.public.view
    def get_player_history(self, player: str, limit: u32) -> list[QuestHistoryView]:
        """
        Safely reconstruct a player's quest history by scanning the quest
        registry (bounded by `quest_counter`), most recent first.

        Args:
            player: Address string to look up.
            limit:  Maximum number of records to return (safety bound).
                    Pass 0 to use the default cap of 50.
        """
        try:
            addr = Address(player)
            max_items = int(limit)
            if max_items <= 0:
                max_items = 50
            if max_items > 200:
                max_items = 200

            history: list[QuestHistoryView] = []
            total = int(self.quest_counter)
            qid = total

            while qid >= 1 and len(history) < max_items:
                key = u32(qid)
                if key in self.quests:
                    q = self.quests[key]
                    if q.player == addr:
                        history.append(
                            QuestHistoryView(
                                quest_id=q.quest_id,
                                status=q.status,
                                status_label=self._status_label(q.status),
                                creativity_score=q.creativity_score,
                                reward=q.reward,
                            )
                        )
                qid -= 1
            return history
        except Exception:
            return []

    @gl.public.view
    def list_active_quests(self, limit: u32) -> list[ActiveQuestView]:
        """Safely list quests currently awaiting an action or resolution.

        Args:
            limit: Maximum number of records to return. Pass 0 to use the
                   default cap of 50.
        """
        try:
            max_items = int(limit)
            if max_items <= 0:
                max_items = 50
            if max_items > 200:
                max_items = 200

            active: list[ActiveQuestView] = []
            total = int(self.quest_counter)

            for qid in range(1, total + 1):
                if len(active) >= max_items:
                    break
                key = u32(qid)
                if key in self.quests:
                    q = self.quests[key]
                    if q.status in (STATUS_ACTIVE, STATUS_SUBMITTED):
                        active.append(
                            ActiveQuestView(
                                quest_id=q.quest_id,
                                player=str(q.player),
                                scenario=q.scenario,
                                status=q.status,
                                status_label=self._status_label(q.status),
                            )
                        )
            return active
        except Exception:
            return []

    def _status_label(self, status: u32) -> str:
        """Map a numeric status code to a human-readable label."""
        try:
            code = int(status)
            return {
                0: "ACTIVE",
                1: "SUBMITTED",
                2: "SUCCESS",
                3: "FAILED",
                4: "CLAIMED",
            }.get(code, "UNKNOWN")
        except Exception:
            return "UNKNOWN"
