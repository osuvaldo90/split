---
created: 2026-01-14T12:00
title: Use graph algorithm to minimize inter-person transactions
area: api
files: []
---

## Problem

When settling a bill split among N people, naive pairwise settlements can result in up to N×(N-1)/2 transactions. For example, if Alice owes Bob $5 and Bob owes Carol $5, naive settlement requires 2 transactions, but optimal settlement has Alice pay Carol $5 directly (1 transaction).

This is the "debt simplification" problem — given a set of people with net balances (some owe money, some are owed money), find the minimum number of transactions to settle all debts.

## Solution

Consider implementing a debt simplification algorithm:

1. **Simple approach**: Calculate net balance for each person (total owed - total owing). People with negative balance pay people with positive balance. Greedy matching can reduce transactions significantly.

2. **Optimal approach**: This is NP-hard for true minimum, but greedy algorithms get close:
   - Calculate net balances
   - Match largest debtor with largest creditor
   - Settle the minimum of the two amounts
   - Repeat until all balanced

3. **Graph-based**: Model as flow network where settlements are edges. Find minimum edge cover.

Research needed on whether the complexity is worth it for typical group sizes (3-8 people). Greedy approach likely sufficient.
