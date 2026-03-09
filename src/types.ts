// Type definitions for AgentScore contract responses
export interface AgentProfile {
  isRegistered: boolean;
  isBlacklisted: boolean;
  score: bigint;
  lastUpdated: bigint;
  assertionCount: bigint;
}

export interface Assertion {
  scoreDelta: bigint;
  data: `0x${string}`;
  timestamp: bigint;
}

export interface Agent {
  tokenId: number;
  owner: `0x${string}`;
  score: number;
  metadataURI: string;
}
