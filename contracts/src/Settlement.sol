// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IJobEscrow} from "./interfaces/IJobEscrow.sol";
import {IWorkerRegistry} from "./interfaces/IWorkerRegistry.sol";
import {IStaking} from "./interfaces/IStaking.sol";

/// @notice Extra escrow view (beyond IJobEscrow) used to enforce worker tier support.
interface IJobEscrowTierView {
    function escrowTier(bytes32 jobId) external view returns (IJobEscrow.ModelTier);
}

/// @title Settlement
/// @notice Verifies worker proof submissions and releases escrowed USDG.
///         Payout is immediate on proof submission; a 60-second dispute window
///         runs afterwards, during which the client may open a dispute. The
///         arbitrator resolves disputes, slashing 5% of a dishonest worker's stake.
contract Settlement {
    uint256 public constant WORKER_BPS_BASE = 7_500;
    uint256 public constant WORKER_BPS_STAKED = 8_500;
    uint256 public constant BPS_DENOMINATOR = 10_000;
    /// @notice Minimum $HCOMPUTE stake (18 decimals) for the boosted payout split.
    uint256 public constant MIN_STAKE_FOR_BONUS = 1_000e18;
    uint64 public constant DISPUTE_WINDOW_SECONDS = 60;
    /// @notice Mirrors JobEscrow.JOB_TIMEOUT_SECONDS; proofs must land before expiry.
    uint64 public constant JOB_TIMEOUT_SECONDS = 120;
    /// @notice USDG units per credit, mirroring JobEscrow.USDG_PER_CREDIT.
    uint256 public constant USDG_PER_CREDIT = 10_000;
    /// @notice Basis points of stake burned from a dishonest worker (5%).
    uint256 public constant SLASH_BPS = 500;

    /// @notice Dispute arbitrator. Defaults to the deployer and is updatable by
    ///         the owner, so it can be moved to a multisig ahead of mainnet
    ///         instead of being frozen at a placeholder address.
    address public arbitrator;

    struct ProofRecord {
        address worker;
        bytes32 outputHash;
        uint256 workerPayout;
        uint256 treasuryPayout;
        uint64 settledAt;
        uint64 disputeWindowCloses;
        bool disputed;
        bool resolved;
        bytes32 clientHash;
        address disputedBy;
    }

    address public owner;
    IJobEscrow public jobEscrow;
    IWorkerRegistry public workerRegistry;
    IStaking public staking;

    mapping(bytes32 => ProofRecord) public proofRecords;

    /// @notice Full proof record for a job as a struct (convenience view).
    function proofRecord(bytes32 jobId) external view returns (ProofRecord memory) {
        return proofRecords[jobId];
    }

    event JobSettled(
        bytes32 indexed jobId,
        address indexed worker,
        uint256 workerPayout,
        uint256 treasuryPayout,
        bytes32 outputHash,
        uint64 latencyMs,
        bool staked
    );
    event DisputeOpened(bytes32 indexed jobId, address indexed disputedBy, bytes32 workerHash, bytes32 clientHash);
    event DisputeResolved(bytes32 indexed jobId, bool workerDishonest, uint256 slashAmount);
    event JobEscrowSet(address indexed jobEscrow);
    event WorkerRegistrySet(address indexed workerRegistry);
    event StakingSet(address indexed staking);
    event ArbitratorSet(address indexed arbitrator);

    error Unauthorized();
    error ZeroAddress();
    error InvalidEscrowStatus();
    error JobExpired();
    error WorkerNotRegistered();
    error WorkerNotActive();
    error TierNotSupported();
    error ProofAlreadySubmitted();
    error ProofNotFound();
    error DisputeWindowClosed();
    error AlreadyDisputed();
    error HashesMatch();
    error NotDisputed();
    error AlreadyResolved();
    error NotJobOwner();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
        arbitrator = msg.sender;
        emit ArbitratorSet(msg.sender);
    }

    function setJobEscrow(address jobEscrow_) external onlyOwner {
        jobEscrow = IJobEscrow(jobEscrow_);
        emit JobEscrowSet(jobEscrow_);
    }

    function setWorkerRegistry(address workerRegistry_) external onlyOwner {
        workerRegistry = IWorkerRegistry(workerRegistry_);
        emit WorkerRegistrySet(workerRegistry_);
    }

    function setStaking(address staking_) external onlyOwner {
        staking = IStaking(staking_);
        emit StakingSet(staking_);
    }

    /// @notice Update the dispute arbitrator. Owner only.
    function setArbitrator(address arbitrator_) external onlyOwner {
        if (arbitrator_ == address(0)) revert ZeroAddress();
        arbitrator = arbitrator_;
        emit ArbitratorSet(arbitrator_);
    }

    /// @notice Submit a completed job's output proof. Caller must be the worker.
    ///         Releases the escrow immediately (worker share now, treasury share
    ///         accrues in the escrow contract) and opens the dispute window.
    function submitProof(bytes32 jobId, bytes32 outputHash, uint64 latencyMs) external {
        if (proofRecords[jobId].settledAt != 0) revert ProofAlreadySubmitted();

        if (jobEscrow.escrowStatus(jobId) != IJobEscrow.EscrowStatus.Locked) revert InvalidEscrowStatus();
        if (uint64(block.timestamp) >= jobEscrow.escrowLockedAt(jobId) + JOB_TIMEOUT_SECONDS) revert JobExpired();

        address worker = msg.sender;
        if (!workerRegistry.isRegistered(worker)) revert WorkerNotRegistered();
        if (!workerRegistry.isActive(worker)) revert WorkerNotActive();

        IJobEscrow.ModelTier tier = IJobEscrowTierView(address(jobEscrow)).escrowTier(jobId);
        uint8 tierMask = uint8(1 << uint8(tier));
        if (!workerRegistry.supportsTier(worker, tierMask)) revert TierNotSupported();

        uint256 totalUsdg = jobEscrow.escrowCredits(jobId) * USDG_PER_CREDIT;
        bool staked = staking.meetsWorkerMinimum(worker);
        uint256 workerBps = staked ? WORKER_BPS_STAKED : WORKER_BPS_BASE;
        uint256 workerPayout = (totalUsdg * workerBps) / BPS_DENOMINATOR;
        uint256 treasuryPayout = totalUsdg - workerPayout;

        // Immediate payout: the escrow releases funds now; the dispute window
        // runs after the fact and a dishonest verdict is punished by slashing.
        jobEscrow.settleEscrow(jobId, worker, workerBps);
        workerRegistry.recordCompletion(worker, true, latencyMs);

        uint64 nowTs = uint64(block.timestamp);
        proofRecords[jobId] = ProofRecord({
            worker: worker,
            outputHash: outputHash,
            workerPayout: workerPayout,
            treasuryPayout: treasuryPayout,
            settledAt: nowTs,
            disputeWindowCloses: nowTs + DISPUTE_WINDOW_SECONDS,
            disputed: false,
            resolved: false,
            clientHash: bytes32(0),
            disputedBy: address(0)
        });

        emit JobSettled(jobId, worker, workerPayout, treasuryPayout, outputHash, latencyMs, staked);
    }

    /// @notice Open a dispute within the window. Caller must be the job's client
    ///         and must present a hash that differs from the worker's output hash.
    function openDispute(bytes32 jobId, bytes32 clientHash) external {
        ProofRecord storage record = proofRecords[jobId];
        if (record.settledAt == 0) revert ProofNotFound();
        if (jobEscrow.escrowClient(jobId) != msg.sender) revert NotJobOwner();
        if (record.disputed) revert AlreadyDisputed();
        if (uint64(block.timestamp) > record.disputeWindowCloses) revert DisputeWindowClosed();
        if (record.outputHash == clientHash) revert HashesMatch();

        record.disputed = true;
        record.clientHash = clientHash;
        record.disputedBy = msg.sender;

        emit DisputeOpened(jobId, msg.sender, record.outputHash, clientHash);
    }

    /// @notice Resolve an open dispute. Arbitrator only. A dishonest verdict burns
    ///         SLASH_BPS (5%) of the worker's stake; an honest verdict changes nothing,
    ///         since the payout was already released on proof submission.
    function resolveDispute(bytes32 jobId, bool workerDishonest) external {
        if (msg.sender != arbitrator) revert Unauthorized();

        ProofRecord storage record = proofRecords[jobId];
        if (record.settledAt == 0) revert ProofNotFound();
        if (!record.disputed) revert NotDisputed();
        if (record.resolved) revert AlreadyResolved();

        record.resolved = true;

        uint256 slashAmount = 0;
        if (workerDishonest) {
            slashAmount = staking.slashWorker(record.worker, SLASH_BPS);
        }

        emit DisputeResolved(jobId, workerDishonest, slashAmount);
    }
}
