// Viem client + minimal ABI (extracted from AgentScoreRegistry.sol)
import { createPublicClient, http, parseAbi } from 'viem';
import { baseSepolia } from 'viem/chains';

export const CONTRACT_ADDRESS = '0x9f603C8213C98F4260d9d79B8c4dD32C7b36C8e2' as const;

export const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org';

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC_URL),
});

export const AGENT_SCORE_ABI = parseAbi([
  'function agentIds(address) view returns (uint256)',
  'function agentProfiles(uint256) view returns ((bool isRegistered, bool isBlacklisted, uint256 score, uint256 lastUpdated, uint256 assertionCount))',
  'function getAllAgents() view returns (uint256[])',
  'function getScoreHistory(uint256,uint256) view returns (uint256[])',
  'function getAgentHistory(uint256) view returns ((int256 scoreDelta, bytes data, uint256 timestamp)[])',
  'function tokenURI(uint256) view returns (string)',
  'function ownerOf(uint256) view returns (address)',
]);
