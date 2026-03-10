import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { publicClient, CONTRACT_ADDRESS, AGENT_SCORE_ABI } from "./config.js";
import type { AgentProfile, Assertion } from "./types.js";

export function registerAgentScoreTools(server: McpServer) {
  // Tool 1: getAgentScore
  server.registerTool(
    "getAgentScore",
    {
      title: "Get Agent Score",
      description:
        "Returns current reputation score, history count and metadata URI. Accepts tokenId (number) OR agent address (0x...)",
      inputSchema: z.object({
        identifier: z.union([
          z.number().int().min(0).describe("Token ID"),
          z
            .string()
            .regex(/^0x[a-fA-F0-9]{40}$/i)
            .describe("Agent address"),
        ]),
      }),
      outputSchema: z.object({
        score: z.number(),
        historyCount: z.number(),
        metadataURI: z.string(),
      }),
    },
    async ({ identifier }: { identifier: number | string }) => {
      try {
        let tokenId: bigint;

        if (typeof identifier === "string") {
          const addr = identifier.toLowerCase() as `0x${string}`;
          tokenId = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: AGENT_SCORE_ABI,
            functionName: "agentIds",
            args: [addr],
          });
          if (tokenId === 0n) throw new Error("Agent not registered");
        } else {
          tokenId = BigInt(identifier);
        }

        const profile = (await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: AGENT_SCORE_ABI,
          functionName: "agentProfiles",
          args: [tokenId],
        })) as AgentProfile;

        if (!profile.isRegistered) throw new Error("Agent not registered");
        if (profile.isBlacklisted) throw new Error("Agent is blacklisted");

        const metadataURI = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: AGENT_SCORE_ABI,
          functionName: "tokenURI",
          args: [tokenId],
        });

        const historyCount = Number(profile.assertionCount) + 1; // initial score + updates

        const result = {
          score: Number(profile.score),
          historyCount,
          metadataURI,
        };

        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${err.message}` }],
        };
      }
    },
  );

  // Tool 2: getAgentHistory (past scores + timestamps)
  server.registerTool(
    "getAgentHistory",
    {
      title: "Get Agent History",
      description:
        "Returns array of past scores with timestamps (recent first)",
      inputSchema: z.object({
        tokenId: z.number().int().min(1),
        limit: z.number().int().min(1).max(100).default(10),
      }),
      outputSchema: z.array(
        z.object({
          score: z.number(),
          timestamp: z.number(),
        }),
      ),
    },
    async ({ tokenId, limit }: { tokenId: number; limit: number }) => {
      try {
        const scores = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: AGENT_SCORE_ABI,
          functionName: "getScoreHistory",
          args: [BigInt(tokenId), BigInt(limit)],
        });

        const assertions = (await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: AGENT_SCORE_ABI,
          functionName: "getAgentHistory",
          args: [BigInt(tokenId)],
        })) as Assertion[];

        const result = scores.map((score, i) => {
          // Align timestamps (initial score has no assertion, later ones do)
          const assertionIndex = Number(scores.length) - 1 - i; // recent first
          const ts =
            assertionIndex < assertions.length
              ? Number(assertions[assertionIndex].timestamp)
              : 0;
          return {
            score: Number(score),
            timestamp: ts,
          };
        });

        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${err.message}` }],
        };
      }
    },
  );

  // Tool 3: listRegisteredAgents
  server.registerTool(
    "listRegisteredAgents",
    {
      title: "List Registered Agents",
      description:
        "List all agents (or single agent by owner address). Returns enriched data.",
      inputSchema: z.object({
        owner: z
          .string()
          .regex(/^0x[a-fA-F0-9]{40}$/i)
          .optional()
          .describe("Optional owner address"),
      }),
      outputSchema: z.array(
        z.object({
          tokenId: z.number(),
          owner: z.string(),
          score: z.number(),
          metadataURI: z.string(),
        }),
      ),
    },
    async ({ owner }: { owner?: string }) => {
      try {
        const agents: any[] = [];

        if (owner) {
          const addr = owner.toLowerCase() as `0x${string}`;
          const tokenId = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: AGENT_SCORE_ABI,
            functionName: "agentIds",
            args: [addr],
          });
          if (tokenId === 0n)
            return {
              content: [{ type: "text", text: "[]" }],
            };

          const profile = (await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: AGENT_SCORE_ABI,
            functionName: "agentProfiles",
            args: [tokenId],
          })) as AgentProfile;
          const uri = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: AGENT_SCORE_ABI,
            functionName: "tokenURI",
            args: [tokenId],
          });
          const ownerAddr = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: AGENT_SCORE_ABI,
            functionName: "ownerOf",
            args: [tokenId],
          });

          agents.push({
            tokenId: Number(tokenId),
            owner: ownerAddr,
            score: Number(profile.score),
            metadataURI: uri,
          });
        } else {
          const tokenIds = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: AGENT_SCORE_ABI,
            functionName: "getAllAgents",
          });

          const enriched = await Promise.all(
            tokenIds.map(async (tid) => {
              const profile = (await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: AGENT_SCORE_ABI,
                functionName: "agentProfiles",
                args: [tid],
              })) as AgentProfile;
              const uri = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: AGENT_SCORE_ABI,
                functionName: "tokenURI",
                args: [tid],
              });
              const ownerAddr = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: AGENT_SCORE_ABI,
                functionName: "ownerOf",
                args: [tid],
              });
              return {
                tokenId: Number(tid),
                owner: ownerAddr,
                score: Number(profile.score),
                metadataURI: uri,
              };
            }),
          );
          agents.push(...enriched);
        }

        return {
          content: [
            { type: "text", text: JSON.stringify(agents, null, 2) },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${err.message}` }],
        };
      }
    },
  );
}
