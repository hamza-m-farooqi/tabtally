import { Schema, model, models, Types } from "mongoose";

export interface ExpenseDocument {
  amount: number;
  note?: string;
  category?: string;
  date: string;
  paidByUserId: Types.ObjectId;
  participantUserIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<ExpenseDocument>(
  {
    amount: { type: Number, required: true },
    note: { type: String },
    category: { type: String },
    date: { type: String, required: true, index: true },
    paidByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    participantUserIds: [
      { type: Schema.Types.ObjectId, ref: "User", required: true },
    ],
  },
  { timestamps: true }
);

export const Expense =
  models.Expense || model<ExpenseDocument>("Expense", ExpenseSchema);
