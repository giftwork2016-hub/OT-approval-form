import { addHours, isAfter } from "date-fns";
import type { ApprovalToken } from "./types";
import { safeRandomUUID } from "./utils";

const tokens = new Map<string, ApprovalToken>();

export function createApprovalTokens(requestId: string): ApprovalToken[] {
  const actions: ApprovalToken["action"][] = ["approve", "reject", "request-info"];
  const created: ApprovalToken[] = [];
  for (const action of actions) {
    const token: ApprovalToken = {
      id: safeRandomUUID(),
      requestId,
      action,
      token: safeRandomUUID(),
      expiresAt: addHours(new Date(), 72).toISOString(),
      usedAt: null,
    };
    tokens.set(token.token, token);
    created.push(token);
  }
  return created;
}

export function verifyApprovalToken(tokenValue: string, action: ApprovalToken["action"]): ApprovalToken {
  const token = tokens.get(tokenValue);
  if (!token) {
    throw new Error("Token not found");
  }
  if (token.action !== action) {
    throw new Error("Token action mismatch");
  }
  if (token.usedAt) {
    throw new Error("Token already used");
  }
  if (isAfter(new Date(), new Date(token.expiresAt))) {
    throw new Error("Token expired");
  }
  return token;
}

export function markTokenUsed(tokenValue: string) {
  const token = tokens.get(tokenValue);
  if (!token) return;
  token.usedAt = new Date().toISOString();
  tokens.set(tokenValue, token);
}

export function listTokensForRequest(requestId: string): ApprovalToken[] {
  return Array.from(tokens.values()).filter((token) => token.requestId === requestId);
}
