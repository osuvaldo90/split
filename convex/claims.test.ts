import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

describe("claims authorization", () => {
  describe("claim", () => {
    it("allows participant to claim item (BTEST-02, BTEST-08)", async () => {
      const t = convexTest(schema);

      // Setup: Create session with participant and item
      const { sessionId, participantId, itemId } = await t.run(async (ctx) => {
        const sessionId = await ctx.db.insert("sessions", {
          code: "ABC123",
          hostName: "Host",
          createdAt: Date.now(),
        });
        const participantId = await ctx.db.insert("participants", {
          sessionId,
          name: "Guest",
          isHost: false,
          joinedAt: Date.now(),
        });
        const itemId = await ctx.db.insert("items", {
          sessionId,
          name: "Burger",
          price: 1500,
          quantity: 1,
        });
        return { sessionId, participantId, itemId };
      });

      // Action: Participant claims item
      const claimId = await t.mutation(api.claims.claim, {
        sessionId,
        itemId,
        participantId,
      });

      // Verify: Claim was created
      expect(claimId).toBeDefined();
      const claim = await t.run(async (ctx) => ctx.db.get(claimId));
      expect(claim?.participantId).toEqual(participantId);
      expect(claim?.itemId).toEqual(itemId);
    });

    it("rejects non-participant claiming (BTEST-02)", async () => {
      const t = convexTest(schema);

      // Setup: Create session with item, and different session with participant
      const { sessionId, itemId, otherParticipantId } = await t.run(async (ctx) => {
        // Session 1 with item
        const sessionId = await ctx.db.insert("sessions", {
          code: "ABC123",
          hostName: "Host1",
          createdAt: Date.now(),
        });
        await ctx.db.insert("participants", {
          sessionId,
          name: "Host1",
          isHost: true,
          joinedAt: Date.now(),
        });
        const itemId = await ctx.db.insert("items", {
          sessionId,
          name: "Burger",
          price: 1500,
          quantity: 1,
        });

        // Session 2 with participant
        const otherSessionId = await ctx.db.insert("sessions", {
          code: "XYZ789",
          hostName: "Host2",
          createdAt: Date.now(),
        });
        const otherParticipantId = await ctx.db.insert("participants", {
          sessionId: otherSessionId,
          name: "Guest2",
          isHost: false,
          joinedAt: Date.now(),
        });

        return { sessionId, itemId, otherParticipantId };
      });

      // Action & Verify: Non-participant cannot claim
      await expect(
        t.mutation(api.claims.claim, {
          sessionId,
          itemId,
          participantId: otherParticipantId,
        })
      ).rejects.toThrow("Not authorized to claim items in this session");
    });

    it("rejects cross-session claim (BTEST-09)", async () => {
      const t = convexTest(schema);

      // Setup: Create two sessions with participants
      const { sessionId, itemId, otherParticipantId } = await t.run(async (ctx) => {
        // Session 1 with item
        const sessionId = await ctx.db.insert("sessions", {
          code: "ABC123",
          hostName: "Host1",
          createdAt: Date.now(),
        });
        await ctx.db.insert("participants", {
          sessionId,
          name: "Host1",
          isHost: true,
          joinedAt: Date.now(),
        });
        const itemId = await ctx.db.insert("items", {
          sessionId,
          name: "Burger",
          price: 1500,
          quantity: 1,
        });

        // Session 2 with participant trying to claim across sessions
        const otherSessionId = await ctx.db.insert("sessions", {
          code: "XYZ789",
          hostName: "Host2",
          createdAt: Date.now(),
        });
        const otherParticipantId = await ctx.db.insert("participants", {
          sessionId: otherSessionId,
          name: "Guest2",
          isHost: false,
          joinedAt: Date.now(),
        });

        return { sessionId, itemId, otherParticipantId };
      });

      // Action & Verify: Cross-session claim rejected
      await expect(
        t.mutation(api.claims.claim, {
          sessionId,
          itemId,
          participantId: otherParticipantId,
        })
      ).rejects.toThrow("Not authorized to claim items in this session");
    });

    it("handles idempotent claim (BTEST-08)", async () => {
      const t = convexTest(schema);

      // Setup: Create session with participant and item
      const { sessionId, participantId, itemId } = await t.run(async (ctx) => {
        const sessionId = await ctx.db.insert("sessions", {
          code: "ABC123",
          hostName: "Host",
          createdAt: Date.now(),
        });
        const participantId = await ctx.db.insert("participants", {
          sessionId,
          name: "Guest",
          isHost: false,
          joinedAt: Date.now(),
        });
        const itemId = await ctx.db.insert("items", {
          sessionId,
          name: "Burger",
          price: 1500,
          quantity: 1,
        });
        return { sessionId, participantId, itemId };
      });

      // Action: Claim same item twice
      const claimId1 = await t.mutation(api.claims.claim, {
        sessionId,
        itemId,
        participantId,
      });
      const claimId2 = await t.mutation(api.claims.claim, {
        sessionId,
        itemId,
        participantId,
      });

      // Verify: Same claim ID returned (idempotent)
      expect(claimId1).toEqual(claimId2);

      // Verify: Only one claim exists
      const claims = await t.run(async (ctx) => {
        return await ctx.db
          .query("claims")
          .filter((q) => q.eq(q.field("itemId"), itemId))
          .collect();
      });
      expect(claims).toHaveLength(1);
    });
  });

  describe("unclaim", () => {
    it("allows participant to unclaim own item (BTEST-08)", async () => {
      const t = convexTest(schema);

      // Setup: Create session with participant, item, and claim
      const { sessionId, participantId, itemId, claimId } = await t.run(async (ctx) => {
        const sessionId = await ctx.db.insert("sessions", {
          code: "ABC123",
          hostName: "Host",
          createdAt: Date.now(),
        });
        const participantId = await ctx.db.insert("participants", {
          sessionId,
          name: "Guest",
          isHost: false,
          joinedAt: Date.now(),
        });
        const itemId = await ctx.db.insert("items", {
          sessionId,
          name: "Burger",
          price: 1500,
          quantity: 1,
        });
        const claimId = await ctx.db.insert("claims", {
          sessionId,
          itemId,
          participantId,
        });
        return { sessionId, participantId, itemId, claimId };
      });

      // Action: Participant unclaims own item
      await t.mutation(api.claims.unclaim, {
        itemId,
        participantId,
        callerParticipantId: participantId, // Self-unclaim
      });

      // Verify: Claim was deleted
      const claim = await t.run(async (ctx) => ctx.db.get(claimId));
      expect(claim).toBeNull();
    });

    it("allows host to unclaim any participant (BTEST-08)", async () => {
      const t = convexTest(schema);

      // Setup: Create session with host, guest, item, and guest's claim
      const { sessionId, hostParticipantId, guestParticipantId, itemId, claimId } = await t.run(async (ctx) => {
        const sessionId = await ctx.db.insert("sessions", {
          code: "ABC123",
          hostName: "Host",
          createdAt: Date.now(),
        });
        const hostParticipantId = await ctx.db.insert("participants", {
          sessionId,
          name: "Host",
          isHost: true,
          joinedAt: Date.now(),
        });
        const guestParticipantId = await ctx.db.insert("participants", {
          sessionId,
          name: "Guest",
          isHost: false,
          joinedAt: Date.now(),
        });
        const itemId = await ctx.db.insert("items", {
          sessionId,
          name: "Burger",
          price: 1500,
          quantity: 1,
        });
        const claimId = await ctx.db.insert("claims", {
          sessionId,
          itemId,
          participantId: guestParticipantId,
        });
        return { sessionId, hostParticipantId, guestParticipantId, itemId, claimId };
      });

      // Action: Host unclaims guest's item
      await t.mutation(api.claims.unclaim, {
        itemId,
        participantId: guestParticipantId,
        callerParticipantId: hostParticipantId, // Host acting
      });

      // Verify: Claim was deleted
      const claim = await t.run(async (ctx) => ctx.db.get(claimId));
      expect(claim).toBeNull();
    });

    it("rejects participant unclaiming others (BTEST-08)", async () => {
      const t = convexTest(schema);

      // Setup: Create session with two non-host participants
      const { sessionId, participant1Id, participant2Id, itemId, claimId } = await t.run(async (ctx) => {
        const sessionId = await ctx.db.insert("sessions", {
          code: "ABC123",
          hostName: "Host",
          createdAt: Date.now(),
        });
        await ctx.db.insert("participants", {
          sessionId,
          name: "Host",
          isHost: true,
          joinedAt: Date.now(),
        });
        const participant1Id = await ctx.db.insert("participants", {
          sessionId,
          name: "Guest1",
          isHost: false,
          joinedAt: Date.now(),
        });
        const participant2Id = await ctx.db.insert("participants", {
          sessionId,
          name: "Guest2",
          isHost: false,
          joinedAt: Date.now(),
        });
        const itemId = await ctx.db.insert("items", {
          sessionId,
          name: "Burger",
          price: 1500,
          quantity: 1,
        });
        // Participant 1 claims the item
        const claimId = await ctx.db.insert("claims", {
          sessionId,
          itemId,
          participantId: participant1Id,
        });
        return { sessionId, participant1Id, participant2Id, itemId, claimId };
      });

      // Action & Verify: Participant 2 cannot unclaim Participant 1's item
      await expect(
        t.mutation(api.claims.unclaim, {
          itemId,
          participantId: participant1Id, // Target
          callerParticipantId: participant2Id, // Caller is not host and not self
        })
      ).rejects.toThrow("Not authorized to unclaim for this participant");
    });
  });

  describe("unclaimByHost", () => {
    it("allows host to unclaim for others (BTEST-07)", async () => {
      const t = convexTest(schema);

      // Setup: Create session with host, guest, item, and guest's claim
      const { sessionId, hostParticipantId, guestParticipantId, itemId, claimId } = await t.run(async (ctx) => {
        const sessionId = await ctx.db.insert("sessions", {
          code: "ABC123",
          hostName: "Host",
          createdAt: Date.now(),
        });
        const hostParticipantId = await ctx.db.insert("participants", {
          sessionId,
          name: "Host",
          isHost: true,
          joinedAt: Date.now(),
        });
        const guestParticipantId = await ctx.db.insert("participants", {
          sessionId,
          name: "Guest",
          isHost: false,
          joinedAt: Date.now(),
        });
        const itemId = await ctx.db.insert("items", {
          sessionId,
          name: "Burger",
          price: 1500,
          quantity: 1,
        });
        const claimId = await ctx.db.insert("claims", {
          sessionId,
          itemId,
          participantId: guestParticipantId,
        });
        return { sessionId, hostParticipantId, guestParticipantId, itemId, claimId };
      });

      // Action: Host unclaims guest's item
      await t.mutation(api.claims.unclaimByHost, {
        itemId,
        participantId: guestParticipantId,
        hostParticipantId,
      });

      // Verify: Claim was deleted
      const claim = await t.run(async (ctx) => ctx.db.get(claimId));
      expect(claim).toBeNull();
    });

    it("rejects non-host using unclaimByHost (BTEST-07)", async () => {
      const t = convexTest(schema);

      // Setup: Create session with participants and claim
      const { sessionId,  guestParticipantId, itemId, claimId } = await t.run(async (ctx) => {
        const sessionId = await ctx.db.insert("sessions", {
          code: "ABC123",
          hostName: "Host",
          createdAt: Date.now(),
        });
        await ctx.db.insert("participants", {
          sessionId,
          name: "Host",
          isHost: true,
          joinedAt: Date.now(),
        });
        const guestParticipantId = await ctx.db.insert("participants", {
          sessionId,
          name: "Guest",
          isHost: false,
          joinedAt: Date.now(),
        });
        const itemId = await ctx.db.insert("items", {
          sessionId,
          name: "Burger",
          price: 1500,
          quantity: 1,
        });
        const claimId = await ctx.db.insert("claims", {
          sessionId,
          itemId,
          participantId: guestParticipantId,
        });
        return { sessionId, guestParticipantId, itemId, claimId };
      });

      // Action & Verify: Non-host cannot use unclaimByHost
      await expect(
        t.mutation(api.claims.unclaimByHost, {
          itemId,
          participantId: guestParticipantId,
          hostParticipantId: guestParticipantId, // Non-host pretending to be host
        })
      ).rejects.toThrow("Only host can unclaim for others");
    });

    it("rejects cross-session host unclaim (BTEST-09)", async () => {
      const t = convexTest(schema);

      // Setup: Create two sessions
      const { itemId, guestParticipantId, otherHostId } = await t.run(async (ctx) => {
        // Session 1 with item and claim
        const sessionId = await ctx.db.insert("sessions", {
          code: "ABC123",
          hostName: "Host1",
          createdAt: Date.now(),
        });
        await ctx.db.insert("participants", {
          sessionId,
          name: "Host1",
          isHost: true,
          joinedAt: Date.now(),
        });
        const guestParticipantId = await ctx.db.insert("participants", {
          sessionId,
          name: "Guest1",
          isHost: false,
          joinedAt: Date.now(),
        });
        const itemId = await ctx.db.insert("items", {
          sessionId,
          name: "Burger",
          price: 1500,
          quantity: 1,
        });
        await ctx.db.insert("claims", {
          sessionId,
          itemId,
          participantId: guestParticipantId,
        });

        // Session 2 with different host
        const otherSessionId = await ctx.db.insert("sessions", {
          code: "XYZ789",
          hostName: "Host2",
          createdAt: Date.now(),
        });
        const otherHostId = await ctx.db.insert("participants", {
          sessionId: otherSessionId,
          name: "Host2",
          isHost: true,
          joinedAt: Date.now(),
        });

        return { itemId, guestParticipantId, otherHostId };
      });

      // Action & Verify: Host from other session cannot unclaim
      await expect(
        t.mutation(api.claims.unclaimByHost, {
          itemId,
          participantId: guestParticipantId,
          hostParticipantId: otherHostId,
        })
      ).rejects.toThrow("Host not in this session");
    });
  });
});
