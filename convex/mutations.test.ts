import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

describe("session creation", () => {
  it("generates valid 6-char code (BTEST-16)", async () => {
    const t = convexTest(schema);

    const result = await t.mutation(api.sessions.create, { hostName: "Host" });

    expect(result.code).toHaveLength(6);
    // Valid chars: ABCDEFGHJKLMNPQRSTUVWXYZ23456789 (no 0/O, 1/I/L)
    expect(result.code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
  });

  it("creates host participant with correct name and isHost=true (BTEST-16)", async () => {
    const t = convexTest(schema);

    const result = await t.mutation(api.sessions.create, { hostName: "Alice" });

    // Verify host participant was created
    const participant = await t.run(async (ctx) =>
      ctx.db.get(result.hostParticipantId)
    );

    expect(participant).not.toBeNull();
    expect(participant?.name).toBe("Alice");
    expect(participant?.isHost).toBe(true);
    expect(participant?.sessionId).toEqual(result.sessionId);
  });

  it("trims whitespace from host name (BTEST-16)", async () => {
    const t = convexTest(schema);

    const result = await t.mutation(api.sessions.create, {
      hostName: "  Bob  ",
    });

    const participant = await t.run(async (ctx) =>
      ctx.db.get(result.hostParticipantId)
    );

    expect(participant?.name).toBe("Bob");
  });
});

describe("participant join", () => {
  it("creates participant with correct sessionId and isHost=false (BTEST-17)", async () => {
    const t = convexTest(schema);

    // Setup: Create session
    const { sessionId } = await t.mutation(api.sessions.create, {
      hostName: "Host",
    });

    // Action: Join as non-host
    const participantId = await t.mutation(api.participants.join, {
      sessionId,
      name: "Guest",
    });

    // Verify: Participant has correct properties
    const participant = await t.run(async (ctx) => ctx.db.get(participantId));

    expect(participant).not.toBeNull();
    expect(participant?.sessionId).toEqual(sessionId);
    expect(participant?.isHost).toBe(false);
    expect(participant?.name).toBe("Guest");
  });

  it("trims and validates name on join (BTEST-17)", async () => {
    const t = convexTest(schema);

    // Setup: Create session
    const { sessionId } = await t.mutation(api.sessions.create, {
      hostName: "Host",
    });

    // Action: Join with whitespace-padded name
    const participantId = await t.mutation(api.participants.join, {
      sessionId,
      name: "  Charlie  ",
    });

    // Verify: Name is trimmed
    const participant = await t.run(async (ctx) => ctx.db.get(participantId));
    expect(participant?.name).toBe("Charlie");
  });

  it("rejects joining non-existent session (BTEST-17)", async () => {
    const t = convexTest(schema);

    // Create a valid session first to get a valid ID format
    const { sessionId } = await t.mutation(api.sessions.create, {
      hostName: "Host",
    });

    // Delete the session to simulate non-existent
    await t.run(async (ctx) => {
      // Delete participants first
      const participants = await ctx.db
        .query("participants")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect();
      for (const p of participants) {
        await ctx.db.delete(p._id);
      }
      await ctx.db.delete(sessionId);
    });

    // Action & Verify: Cannot join deleted session
    await expect(
      t.mutation(api.participants.join, {
        sessionId,
        name: "Guest",
      })
    ).rejects.toThrow("Session not found");
  });
});

describe("duplicate name handling", () => {
  it("rejects exact duplicate name (BTEST-18)", async () => {
    const t = convexTest(schema);

    // Setup: Create session with host "Alice"
    const { sessionId } = await t.mutation(api.sessions.create, {
      hostName: "Alice",
    });

    // Action & Verify: Cannot join with same name
    await expect(
      t.mutation(api.participants.join, {
        sessionId,
        name: "Alice",
      })
    ).rejects.toThrow("That name is already taken");
  });

  it("rejects case-insensitive duplicate name (BTEST-18)", async () => {
    const t = convexTest(schema);

    // Setup: Create session with host "John"
    const { sessionId } = await t.mutation(api.sessions.create, {
      hostName: "John",
    });

    // Action & Verify: Cannot join with different case
    await expect(
      t.mutation(api.participants.join, {
        sessionId,
        name: "john",
      })
    ).rejects.toThrow("That name is already taken");

    await expect(
      t.mutation(api.participants.join, {
        sessionId,
        name: "JOHN",
      })
    ).rejects.toThrow("That name is already taken");

    await expect(
      t.mutation(api.participants.join, {
        sessionId,
        name: "JoHn",
      })
    ).rejects.toThrow("That name is already taken");
  });

  it("allows different names in same session (BTEST-18)", async () => {
    const t = convexTest(schema);

    // Setup: Create session
    const { sessionId } = await t.mutation(api.sessions.create, {
      hostName: "Alice",
    });

    // Action: Join with different name should work
    const bobId = await t.mutation(api.participants.join, {
      sessionId,
      name: "Bob",
    });

    expect(bobId).toBeDefined();
  });

  it("allows same name in different sessions (BTEST-18)", async () => {
    const t = convexTest(schema);

    // Setup: Create two sessions
    const session1 = await t.mutation(api.sessions.create, {
      hostName: "Alice",
    });
    const session2 = await t.mutation(api.sessions.create, {
      hostName: "Charlie",
    });

    // Action: Join session2 with "Alice" should work (different session)
    const aliceInSession2 = await t.mutation(api.participants.join, {
      sessionId: session2.sessionId,
      name: "Alice",
    });

    expect(aliceInSession2).toBeDefined();
  });
});

describe("claim idempotency", () => {
  it("returns same claim ID when claiming twice (BTEST-19)", async () => {
    const t = convexTest(schema);

    // Setup: Create session with item and participant
    const { sessionId, hostParticipantId } = await t.mutation(
      api.sessions.create,
      { hostName: "Host" }
    );

    const itemId = await t.mutation(api.items.add, {
      sessionId,
      participantId: hostParticipantId,
      name: "Pizza",
      price: 1500,
    });

    // Action: Claim the same item twice
    const firstClaimId = await t.mutation(api.claims.claim, {
      sessionId,
      itemId,
      participantId: hostParticipantId,
    });

    const secondClaimId = await t.mutation(api.claims.claim, {
      sessionId,
      itemId,
      participantId: hostParticipantId,
    });

    // Verify: Same claim ID returned both times
    expect(secondClaimId).toEqual(firstClaimId);
  });

  it("creates only one claim record after double-claim (BTEST-19)", async () => {
    const t = convexTest(schema);

    // Setup: Create session with item and participant
    const { sessionId, hostParticipantId } = await t.mutation(
      api.sessions.create,
      { hostName: "Host" }
    );

    const itemId = await t.mutation(api.items.add, {
      sessionId,
      participantId: hostParticipantId,
      name: "Burger",
      price: 1200,
    });

    // Action: Claim the same item twice
    await t.mutation(api.claims.claim, {
      sessionId,
      itemId,
      participantId: hostParticipantId,
    });

    await t.mutation(api.claims.claim, {
      sessionId,
      itemId,
      participantId: hostParticipantId,
    });

    // Verify: Only one claim exists in database
    const allClaims = await t.run(async (ctx) =>
      ctx.db
        .query("claims")
        .withIndex("by_item", (q) => q.eq("itemId", itemId))
        .collect()
    );

    expect(allClaims).toHaveLength(1);
  });

  it("properly creates claim on first call (BTEST-19)", async () => {
    const t = convexTest(schema);

    // Setup: Create session with item and participant
    const { sessionId, hostParticipantId } = await t.mutation(
      api.sessions.create,
      { hostName: "Host" }
    );

    const itemId = await t.mutation(api.items.add, {
      sessionId,
      participantId: hostParticipantId,
      name: "Salad",
      price: 800,
    });

    // Action: Claim the item
    const claimId = await t.mutation(api.claims.claim, {
      sessionId,
      itemId,
      participantId: hostParticipantId,
    });

    // Verify: Claim has correct properties
    const claim = await t.run(async (ctx) => ctx.db.get(claimId));

    expect(claim).not.toBeNull();
    expect(claim?.sessionId).toEqual(sessionId);
    expect(claim?.itemId).toEqual(itemId);
    expect(claim?.participantId).toEqual(hostParticipantId);
  });
});

describe("item removal cascade", () => {
  it("deletes item when host removes it (BTEST-20)", async () => {
    const t = convexTest(schema);

    // Setup: Create session with item
    const { sessionId, hostParticipantId } = await t.mutation(
      api.sessions.create,
      { hostName: "Host" }
    );

    const itemId = await t.mutation(api.items.add, {
      sessionId,
      participantId: hostParticipantId,
      name: "Appetizer",
      price: 900,
    });

    // Action: Host removes item
    await t.mutation(api.items.remove, {
      itemId,
      participantId: hostParticipantId,
    });

    // Verify: Item is deleted
    const item = await t.run(async (ctx) => ctx.db.get(itemId));
    expect(item).toBeNull();
  });

  it("deletes all associated claims when item is removed (BTEST-20)", async () => {
    const t = convexTest(schema);

    // Setup: Create session with host, item, and 2 participants who claim it
    const { sessionId, hostParticipantId } = await t.mutation(
      api.sessions.create,
      { hostName: "Host" }
    );

    const guest1Id = await t.mutation(api.participants.join, {
      sessionId,
      name: "Guest1",
    });

    const guest2Id = await t.mutation(api.participants.join, {
      sessionId,
      name: "Guest2",
    });

    const itemId = await t.mutation(api.items.add, {
      sessionId,
      participantId: hostParticipantId,
      name: "Shared Nachos",
      price: 1500,
    });

    // Both guests claim the item
    await t.mutation(api.claims.claim, {
      sessionId,
      itemId,
      participantId: guest1Id,
    });

    await t.mutation(api.claims.claim, {
      sessionId,
      itemId,
      participantId: guest2Id,
    });

    // Verify: 2 claims exist before removal
    const claimsBefore = await t.run(async (ctx) =>
      ctx.db
        .query("claims")
        .withIndex("by_item", (q) => q.eq("itemId", itemId))
        .collect()
    );
    expect(claimsBefore).toHaveLength(2);

    // Action: Host removes item
    await t.mutation(api.items.remove, {
      itemId,
      participantId: hostParticipantId,
    });

    // Verify: Both item and all claims are deleted
    const item = await t.run(async (ctx) => ctx.db.get(itemId));
    expect(item).toBeNull();

    const claimsAfter = await t.run(async (ctx) =>
      ctx.db
        .query("claims")
        .withIndex("by_item", (q) => q.eq("itemId", itemId))
        .collect()
    );
    expect(claimsAfter).toHaveLength(0);
  });

  it("cascade deletion works even with no claims (BTEST-20)", async () => {
    const t = convexTest(schema);

    // Setup: Create session with unclaimed item
    const { sessionId, hostParticipantId } = await t.mutation(
      api.sessions.create,
      { hostName: "Host" }
    );

    const itemId = await t.mutation(api.items.add, {
      sessionId,
      participantId: hostParticipantId,
      name: "Unclaimed Item",
      price: 500,
    });

    // Verify: No claims exist
    const claimsBefore = await t.run(async (ctx) =>
      ctx.db
        .query("claims")
        .withIndex("by_item", (q) => q.eq("itemId", itemId))
        .collect()
    );
    expect(claimsBefore).toHaveLength(0);

    // Action: Host removes item
    await t.mutation(api.items.remove, {
      itemId,
      participantId: hostParticipantId,
    });

    // Verify: Item is deleted
    const item = await t.run(async (ctx) => ctx.db.get(itemId));
    expect(item).toBeNull();
  });
});
