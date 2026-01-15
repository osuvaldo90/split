import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

describe("sessions authorization", () => {
  // Test fixtures
  let sessionId: Id<"sessions">;
  let hostParticipantId: Id<"participants">;
  let nonHostParticipantId: Id<"participants">;
  let otherSessionId: Id<"sessions">;
  let otherSessionHostId: Id<"participants">;

  describe("updateTip", () => {
    it("allows host to update tip (BTEST-03, BTEST-07)", async () => {
      const t = convexTest(schema);

      // Setup: Create session with host
      const { sessionId, hostParticipantId } = await t.run(async (ctx) => {
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
        return { sessionId, hostParticipantId };
      });

      // Action: Host updates tip
      await t.mutation(api.sessions.updateTip, {
        sessionId,
        participantId: hostParticipantId,
        tipType: "percent_subtotal",
        tipValue: 18,
      });

      // Verify: Session has updated tip settings
      const session = await t.run(async (ctx) => ctx.db.get(sessionId));
      expect(session?.tipType).toBe("percent_subtotal");
      expect(session?.tipValue).toBe(18);
    });

    it("rejects non-host updating tip (BTEST-03)", async () => {
      const t = convexTest(schema);

      // Setup: Create session with host and non-host participant
      const { sessionId, nonHostParticipantId } = await t.run(async (ctx) => {
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
        const nonHostParticipantId = await ctx.db.insert("participants", {
          sessionId,
          name: "Guest",
          isHost: false,
          joinedAt: Date.now(),
        });
        return { sessionId, nonHostParticipantId };
      });

      // Action & Verify: Non-host cannot update tip
      await expect(
        t.mutation(api.sessions.updateTip, {
          sessionId,
          participantId: nonHostParticipantId,
          tipType: "percent_subtotal",
          tipValue: 18,
        })
      ).rejects.toThrow("Only the host can modify bill settings");
    });

    it("rejects cross-session tip update (BTEST-09)", async () => {
      const t = convexTest(schema);

      // Setup: Create two sessions, each with host
      const { sessionId, otherSessionHostId } = await t.run(async (ctx) => {
        // Session 1
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

        // Session 2
        const otherSessionId = await ctx.db.insert("sessions", {
          code: "XYZ789",
          hostName: "Host2",
          createdAt: Date.now(),
        });
        const otherSessionHostId = await ctx.db.insert("participants", {
          sessionId: otherSessionId,
          name: "Host2",
          isHost: true,
          joinedAt: Date.now(),
        });

        return { sessionId, otherSessionHostId };
      });

      // Action & Verify: Host from other session cannot update tip
      await expect(
        t.mutation(api.sessions.updateTip, {
          sessionId,
          participantId: otherSessionHostId,
          tipType: "percent_subtotal",
          tipValue: 18,
        })
      ).rejects.toThrow("Participant not in this session");
    });
  });

  describe("updateTax", () => {
    it("allows host to update tax (BTEST-04, BTEST-07)", async () => {
      const t = convexTest(schema);

      // Setup: Create session with host
      const { sessionId, hostParticipantId } = await t.run(async (ctx) => {
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
        return { sessionId, hostParticipantId };
      });

      // Action: Host updates tax
      await t.mutation(api.sessions.updateTax, {
        sessionId,
        participantId: hostParticipantId,
        tax: 850, // $8.50 in cents
      });

      // Verify: Session has updated tax
      const session = await t.run(async (ctx) => ctx.db.get(sessionId));
      expect(session?.tax).toBe(850);
    });

    it("rejects non-host updating tax (BTEST-04)", async () => {
      const t = convexTest(schema);

      // Setup: Create session with host and non-host participant
      const { sessionId, nonHostParticipantId } = await t.run(async (ctx) => {
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
        const nonHostParticipantId = await ctx.db.insert("participants", {
          sessionId,
          name: "Guest",
          isHost: false,
          joinedAt: Date.now(),
        });
        return { sessionId, nonHostParticipantId };
      });

      // Action & Verify: Non-host cannot update tax
      await expect(
        t.mutation(api.sessions.updateTax, {
          sessionId,
          participantId: nonHostParticipantId,
          tax: 850,
        })
      ).rejects.toThrow("Only the host can modify bill settings");
    });

    it("rejects cross-session tax update (BTEST-09)", async () => {
      const t = convexTest(schema);

      // Setup: Create two sessions
      const { sessionId, otherSessionHostId } = await t.run(async (ctx) => {
        // Session 1
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

        // Session 2
        const otherSessionId = await ctx.db.insert("sessions", {
          code: "XYZ789",
          hostName: "Host2",
          createdAt: Date.now(),
        });
        const otherSessionHostId = await ctx.db.insert("participants", {
          sessionId: otherSessionId,
          name: "Host2",
          isHost: true,
          joinedAt: Date.now(),
        });

        return { sessionId, otherSessionHostId };
      });

      // Action & Verify: Host from other session cannot update tax
      await expect(
        t.mutation(api.sessions.updateTax, {
          sessionId,
          participantId: otherSessionHostId,
          tax: 850,
        })
      ).rejects.toThrow("Participant not in this session");
    });
  });

  describe("updateGratuity", () => {
    it("allows host to update gratuity (BTEST-07)", async () => {
      const t = convexTest(schema);

      // Setup: Create session with host
      const { sessionId, hostParticipantId } = await t.run(async (ctx) => {
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
        return { sessionId, hostParticipantId };
      });

      // Action: Host updates gratuity
      await t.mutation(api.sessions.updateGratuity, {
        sessionId,
        participantId: hostParticipantId,
        gratuity: 1500, // $15.00 auto-gratuity
      });

      // Verify: Session has updated gratuity
      const session = await t.run(async (ctx) => ctx.db.get(sessionId));
      expect(session?.gratuity).toBe(1500);
    });

    it("rejects non-host updating gratuity (BTEST-07)", async () => {
      const t = convexTest(schema);

      // Setup: Create session with host and non-host participant
      const { sessionId, nonHostParticipantId } = await t.run(async (ctx) => {
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
        const nonHostParticipantId = await ctx.db.insert("participants", {
          sessionId,
          name: "Guest",
          isHost: false,
          joinedAt: Date.now(),
        });
        return { sessionId, nonHostParticipantId };
      });

      // Action & Verify: Non-host cannot update gratuity
      await expect(
        t.mutation(api.sessions.updateGratuity, {
          sessionId,
          participantId: nonHostParticipantId,
          gratuity: 1500,
        })
      ).rejects.toThrow("Only the host can modify bill settings");
    });

    it("rejects cross-session gratuity update (BTEST-09)", async () => {
      const t = convexTest(schema);

      // Setup: Create two sessions
      const { sessionId, otherSessionHostId } = await t.run(async (ctx) => {
        // Session 1
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

        // Session 2
        const otherSessionId = await ctx.db.insert("sessions", {
          code: "XYZ789",
          hostName: "Host2",
          createdAt: Date.now(),
        });
        const otherSessionHostId = await ctx.db.insert("participants", {
          sessionId: otherSessionId,
          name: "Host2",
          isHost: true,
          joinedAt: Date.now(),
        });

        return { sessionId, otherSessionHostId };
      });

      // Action & Verify: Host from other session cannot update gratuity
      await expect(
        t.mutation(api.sessions.updateGratuity, {
          sessionId,
          participantId: otherSessionHostId,
          gratuity: 1500,
        })
      ).rejects.toThrow("Participant not in this session");
    });
  });
});
