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
        }),
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
        }),
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
        }),
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
        }),
      ).rejects.toThrow("Participant not in this session");
    });
  });
  describe("deleteByCode", () => {
    // Seed a session with MULTIPLE rows per child table, so a handler that
    // deletes only the first row of each is distinguishable from one that
    // deletes them all.
    async function seedFullSession(
      t: ReturnType<typeof convexTest>,
      code: string,
    ) {
      return await t.run(async (ctx) => {
        const sessionId = await ctx.db.insert("sessions", {
          code,
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
        for (const [name, price] of [
          ["Burger", 1200],
          ["Fries", 450],
          ["Soda", 300],
        ] as const) {
          const itemId = await ctx.db.insert("items", {
            sessionId,
            name,
            price,
            quantity: 1,
          });
          await ctx.db.insert("claims", {
            sessionId,
            itemId,
            participantId: hostParticipantId,
          });
          await ctx.db.insert("claims", {
            sessionId,
            itemId,
            participantId: guestParticipantId,
          });
        }
        await ctx.db.insert("fees", {
          sessionId,
          label: "Sales Tax",
          amount: 100,
        });
        await ctx.db.insert("fees", {
          sessionId,
          label: "Service Fee",
          amount: 250,
        });
        return { sessionId, hostParticipantId, guestParticipantId };
      });
    }

    // Scoped to one session on purpose: counting rows globally would let a
    // handler that ignores sessionId and wipes every table pass unnoticed.
    async function countSessionRows(
      t: ReturnType<typeof convexTest>,
      sessionId: Id<"sessions">,
    ) {
      return await t.run(async (ctx) => {
        const countIn = async (
          table: "participants" | "items" | "claims" | "fees",
        ) =>
          (
            await ctx.db
              .query(table)
              .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
              .collect()
          ).length;

        return {
          session: (await ctx.db.get(sessionId)) === null ? 0 : 1,
          participants: await countIn("participants"),
          items: await countIn("items"),
          claims: await countIn("claims"),
          fees: await countIn("fees"),
        };
      });
    }

    it("allows host to delete the bill", async () => {
      const t = convexTest(schema);
      const { sessionId, hostParticipantId } = await seedFullSession(
        t,
        "ABC123",
      );

      await t.mutation(api.sessions.deleteByCode, {
        code: "ABC123",
        participantId: hostParticipantId,
      });

      expect(await t.run(async (ctx) => ctx.db.get(sessionId))).toBeNull();
    });

    it("deletes every child row, leaving nothing orphaned", async () => {
      const t = convexTest(schema);
      const { sessionId, hostParticipantId } = await seedFullSession(
        t,
        "ABC123",
      );

      // Guard the fixture itself: multiple rows per table, or the assertion
      // below cannot tell a loop from a single delete.
      expect(await countSessionRows(t, sessionId)).toEqual({
        session: 1,
        participants: 2,
        items: 3,
        claims: 6,
        fees: 2,
      });

      await t.mutation(api.sessions.deleteByCode, {
        code: "ABC123",
        participantId: hostParticipantId,
      });

      expect(await countSessionRows(t, sessionId)).toEqual({
        session: 0,
        participants: 0,
        items: 0,
        claims: 0,
        fees: 0,
      });
    });

    it("leaves other sessions completely untouched", async () => {
      const t = convexTest(schema);
      const { hostParticipantId } = await seedFullSession(t, "ABC123");
      const { sessionId: otherSessionId } = await seedFullSession(t, "XYZ789");

      await t.mutation(api.sessions.deleteByCode, {
        code: "ABC123",
        participantId: hostParticipantId,
      });

      expect(await countSessionRows(t, otherSessionId)).toEqual({
        session: 1,
        participants: 2,
        items: 3,
        claims: 6,
        fees: 2,
      });
    });

    it("deletes the uploaded receipt image from file storage", async () => {
      const t = convexTest(schema);
      const { sessionId, hostParticipantId } = await seedFullSession(
        t,
        "ABC123",
      );

      const storageId = await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(
          new Blob(["receipt bytes"], { type: "image/jpeg" }),
        );
        await ctx.db.patch(sessionId, { receiptImageId: storageId });
        return storageId;
      });

      await t.mutation(api.sessions.deleteByCode, {
        code: "ABC123",
        participantId: hostParticipantId,
      });

      expect(
        await t.run(async (ctx) => ctx.storage.getUrl(storageId)),
      ).toBeNull();
    });

    it("still deletes the bill when the receipt file is already gone", async () => {
      const t = convexTest(schema);
      const { sessionId, hostParticipantId } = await seedFullSession(
        t,
        "ABC123",
      );

      // Dangling pointer: receiptImageId set, underlying file removed.
      // An unguarded ctx.storage.delete would throw and roll the whole
      // mutation back, leaving the bill permanently undeletable.
      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(new Blob(["gone soon"]));
        await ctx.db.patch(sessionId, { receiptImageId: storageId });
        await ctx.storage.delete(storageId);
      });

      await t.mutation(api.sessions.deleteByCode, {
        code: "ABC123",
        participantId: hostParticipantId,
      });

      expect(await countSessionRows(t, sessionId)).toEqual({
        session: 0,
        participants: 0,
        items: 0,
        claims: 0,
        fees: 0,
      });
    });

    it("rejects a non-host participant and leaves the bill intact", async () => {
      const t = convexTest(schema);
      const { sessionId, guestParticipantId } = await seedFullSession(
        t,
        "ABC123",
      );

      await expect(
        t.mutation(api.sessions.deleteByCode, {
          code: "ABC123",
          participantId: guestParticipantId,
        }),
      ).rejects.toThrow("Only the host can delete this bill");

      expect(await countSessionRows(t, sessionId)).toEqual({
        session: 1,
        participants: 2,
        items: 3,
        claims: 6,
        fees: 2,
      });
    });

    it("rejects a host of a different session", async () => {
      const t = convexTest(schema);
      const { sessionId } = await seedFullSession(t, "ABC123");
      const { hostParticipantId: otherSessionHostId } = await seedFullSession(
        t,
        "XYZ789",
      );

      await expect(
        t.mutation(api.sessions.deleteByCode, {
          code: "ABC123",
          participantId: otherSessionHostId,
        }),
      ).rejects.toThrow("Participant not in this session");

      expect((await countSessionRows(t, sessionId)).session).toBe(1);
    });

    it("normalizes the code before looking up the session", async () => {
      const t = convexTest(schema);
      const { sessionId, hostParticipantId } = await seedFullSession(
        t,
        "ABC123",
      );

      await t.mutation(api.sessions.deleteByCode, {
        code: "  abc123  ",
        participantId: hostParticipantId,
      });

      expect((await countSessionRows(t, sessionId)).session).toBe(0);
    });

    it("is a no-op for a code that does not exist", async () => {
      const t = convexTest(schema);
      const { sessionId, hostParticipantId } = await seedFullSession(
        t,
        "ABC123",
      );

      await t.mutation(api.sessions.deleteByCode, {
        code: "NOSUCH",
        participantId: hostParticipantId,
      });

      expect((await countSessionRows(t, sessionId)).session).toBe(1);
    });
  });
});
