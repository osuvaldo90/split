import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

describe("items authorization", () => {
  describe("add", () => {
    it("allows participant to add item (BTEST-01)", async () => {
      const t = convexTest(schema);

      // Setup: Create session with participant
      const { sessionId, participantId } = await t.run(async (ctx) => {
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
        return { sessionId, participantId };
      });

      // Action: Participant adds item
      const itemId = await t.mutation(api.items.add, {
        sessionId,
        participantId,
        name: "Burger",
        price: 1500, // $15.00
      });

      // Verify: Item was created
      expect(itemId).toBeDefined();
      const item = await t.run(async (ctx) => ctx.db.get(itemId));
      expect(item?.name).toBe("Burger");
      expect(item?.price).toBe(1500);
    });

    it("rejects non-participant adding item (BTEST-01)", async () => {
      const t = convexTest(schema);

      // Setup: Create session, but participantId doesn't exist
      const { sessionId } = await t.run(async (ctx) => {
        const sessionId = await ctx.db.insert("sessions", {
          code: "ABC123",
          hostName: "Host",
          createdAt: Date.now(),
        });
        // Create a participant for a DIFFERENT session to get a valid ID format
        const otherSessionId = await ctx.db.insert("sessions", {
          code: "XYZ789",
          hostName: "Other",
          createdAt: Date.now(),
        });
        const otherParticipantId = await ctx.db.insert("participants", {
          sessionId: otherSessionId,
          name: "OtherGuest",
          isHost: false,
          joinedAt: Date.now(),
        });
        return { sessionId, otherParticipantId };
      });

      // Get a participant from another session
      const { otherParticipantId } = await t.run(async (ctx) => {
        const otherSession = await ctx.db
          .query("sessions")
          .filter((q) => q.eq(q.field("code"), "XYZ789"))
          .first();
        const otherParticipant = await ctx.db
          .query("participants")
          .filter((q) => q.eq(q.field("sessionId"), otherSession!._id))
          .first();
        return { otherParticipantId: otherParticipant!._id };
      });

      // Action & Verify: Non-participant cannot add item
      await expect(
        t.mutation(api.items.add, {
          sessionId,
          participantId: otherParticipantId,
          name: "Burger",
          price: 1500,
        })
      ).rejects.toThrow("Not authorized to add items to this session");
    });

    it("rejects cross-session item add (BTEST-09)", async () => {
      const t = convexTest(schema);

      // Setup: Create two sessions with participants
      const { sessionId, otherParticipantId } = await t.run(async (ctx) => {
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
        const otherParticipantId = await ctx.db.insert("participants", {
          sessionId: otherSessionId,
          name: "Host2",
          isHost: true,
          joinedAt: Date.now(),
        });

        return { sessionId, otherParticipantId };
      });

      // Action & Verify: Participant from other session cannot add item
      await expect(
        t.mutation(api.items.add, {
          sessionId,
          participantId: otherParticipantId,
          name: "Burger",
          price: 1500,
        })
      ).rejects.toThrow("Not authorized to add items to this session");
    });
  });

  describe("remove", () => {
    it("allows host to remove item (BTEST-05, BTEST-07)", async () => {
      const t = convexTest(schema);

      // Setup: Create session with host and an item
      const { sessionId, hostParticipantId, itemId } = await t.run(async (ctx) => {
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
        const itemId = await ctx.db.insert("items", {
          sessionId,
          name: "Burger",
          price: 1500,
          quantity: 1,
        });
        return { sessionId, hostParticipantId, itemId };
      });

      // Action: Host removes item
      await t.mutation(api.items.remove, {
        itemId,
        participantId: hostParticipantId,
      });

      // Verify: Item was deleted
      const item = await t.run(async (ctx) => ctx.db.get(itemId));
      expect(item).toBeNull();
    });

    it("cascades claim deletion when item removed (BTEST-05)", async () => {
      const t = convexTest(schema);

      // Setup: Create session with host, item, and claims
      const { sessionId, hostParticipantId, itemId, claimId } = await t.run(async (ctx) => {
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
        return { sessionId, hostParticipantId, itemId, claimId };
      });

      // Action: Host removes item
      await t.mutation(api.items.remove, {
        itemId,
        participantId: hostParticipantId,
      });

      // Verify: Both item and claim were deleted
      const item = await t.run(async (ctx) => ctx.db.get(itemId));
      const claim = await t.run(async (ctx) => ctx.db.get(claimId));
      expect(item).toBeNull();
      expect(claim).toBeNull();
    });

    it("rejects non-host removing item (BTEST-05)", async () => {
      const t = convexTest(schema);

      // Setup: Create session with host, non-host, and item
      const { sessionId, nonHostParticipantId, itemId } = await t.run(async (ctx) => {
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
        const itemId = await ctx.db.insert("items", {
          sessionId,
          name: "Burger",
          price: 1500,
          quantity: 1,
        });
        return { sessionId, nonHostParticipantId, itemId };
      });

      // Action & Verify: Non-host cannot remove item
      await expect(
        t.mutation(api.items.remove, {
          itemId,
          participantId: nonHostParticipantId,
        })
      ).rejects.toThrow("Only the host can remove items");
    });

    it("rejects cross-session item removal (BTEST-09)", async () => {
      const t = convexTest(schema);

      // Setup: Create two sessions - item in one, host from another
      const { itemId, otherHostId } = await t.run(async (ctx) => {
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

        return { itemId, otherHostId };
      });

      // Action & Verify: Host from other session cannot remove item
      await expect(
        t.mutation(api.items.remove, {
          itemId,
          participantId: otherHostId,
        })
      ).rejects.toThrow("Participant not in this session");
    });
  });

  describe("addBulk", () => {
    it("allows host to bulk add items (BTEST-06, BTEST-07)", async () => {
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

      // Action: Host bulk adds items
      const itemIds = await t.mutation(api.items.addBulk, {
        sessionId,
        participantId: hostParticipantId,
        items: [
          { name: "Burger", price: 1500 },
          { name: "Fries", price: 500 },
          { name: "Drink", price: 300 },
        ],
      });

      // Verify: Items were created
      expect(itemIds).toHaveLength(3);
      const items = await t.run(async (ctx) => {
        return await ctx.db
          .query("items")
          .filter((q) => q.eq(q.field("sessionId"), sessionId))
          .collect();
      });
      expect(items).toHaveLength(3);
      expect(items.map((i) => i.name).sort()).toEqual(["Burger", "Drink", "Fries"]);
    });

    it("rejects non-host bulk adding (BTEST-06)", async () => {
      const t = convexTest(schema);

      // Setup: Create session with host and non-host
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

      // Action & Verify: Non-host cannot bulk add
      await expect(
        t.mutation(api.items.addBulk, {
          sessionId,
          participantId: nonHostParticipantId,
          items: [
            { name: "Burger", price: 1500 },
          ],
        })
      ).rejects.toThrow("Only the host can replace all items");
    });

    it("rejects cross-session bulk add (BTEST-09)", async () => {
      const t = convexTest(schema);

      // Setup: Create two sessions
      const { sessionId, otherHostId } = await t.run(async (ctx) => {
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
        const otherHostId = await ctx.db.insert("participants", {
          sessionId: otherSessionId,
          name: "Host2",
          isHost: true,
          joinedAt: Date.now(),
        });

        return { sessionId, otherHostId };
      });

      // Action & Verify: Host from other session cannot bulk add
      await expect(
        t.mutation(api.items.addBulk, {
          sessionId,
          participantId: otherHostId,
          items: [
            { name: "Burger", price: 1500 },
          ],
        })
      ).rejects.toThrow("Participant not in this session");
    });

    it("replaces existing items when bulk adding (BTEST-06)", async () => {
      const t = convexTest(schema);

      // Setup: Create session with host and existing items
      const { sessionId, hostParticipantId, existingItemId } = await t.run(async (ctx) => {
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
        const existingItemId = await ctx.db.insert("items", {
          sessionId,
          name: "OldItem",
          price: 999,
          quantity: 1,
        });
        return { sessionId, hostParticipantId, existingItemId };
      });

      // Action: Host bulk adds new items (should replace existing)
      await t.mutation(api.items.addBulk, {
        sessionId,
        participantId: hostParticipantId,
        items: [
          { name: "NewItem1", price: 1000 },
          { name: "NewItem2", price: 2000 },
        ],
      });

      // Verify: Old item deleted, new items exist
      const oldItem = await t.run(async (ctx) => ctx.db.get(existingItemId));
      expect(oldItem).toBeNull();

      const items = await t.run(async (ctx) => {
        return await ctx.db
          .query("items")
          .filter((q) => q.eq(q.field("sessionId"), sessionId))
          .collect();
      });
      expect(items).toHaveLength(2);
      expect(items.map((i) => i.name).sort()).toEqual(["NewItem1", "NewItem2"]);
    });
  });
});
