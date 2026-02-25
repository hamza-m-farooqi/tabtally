import { Types } from "mongoose";
import { ExpenseDocument } from "@/models/Expense";

type UserId = string;

export function summarizeDayForUser(
  expenses: ExpenseDocument[],
  userId: UserId
) {
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  let paidByMeTotal = 0;
  let myShareTotal = 0;

  for (const e of expenses) {
    const participants = e.participantUserIds.map((id) => id.toString());
    const share = e.amount / Math.max(participants.length, 1);
    if (e.paidByUserId.toString() === userId) {
      paidByMeTotal += e.amount;
    }
    if (participants.includes(userId)) {
      myShareTotal += share;
    }
  }

  const net = roundCurrency(paidByMeTotal - myShareTotal);

  return {
    totalExpense: roundCurrency(totalExpense),
    youPaid: roundCurrency(paidByMeTotal),
    yourShare: roundCurrency(myShareTotal),
    yourNet: net,
  };
}

export function buildPairwiseNet(
  expenses: ExpenseDocument[],
  currentUserId: UserId,
  otherUserIds: UserId[]
) {
  const result: Record<string, number> = {};
  for (const otherId of otherUserIds) {
    let balance = 0;
    for (const e of expenses) {
      const participants = e.participantUserIds.map((id) => id.toString());
      if (!participants.includes(currentUserId)) continue;
      if (!participants.includes(otherId)) continue;

      const share = e.amount / Math.max(participants.length, 1);
      const payer = e.paidByUserId.toString();

      if (payer === currentUserId) {
        balance += share;
      } else if (payer === otherId) {
        balance -= share;
      }
    }
    result[otherId] = roundCurrency(balance);
  }
  return result;
}

export function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function toObjectId(id: string) {
  return new Types.ObjectId(id);
}
