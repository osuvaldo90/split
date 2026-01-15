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
