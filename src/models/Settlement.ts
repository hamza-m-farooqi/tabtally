import { Schema, model, models, Types } from "mongoose";

export interface SettlementDocument {
  date: string;
  expenseIds: Types.ObjectId[];
  paidByUserId: Types.ObjectId;
  paidToUserId: Types.ObjectId;
  amount: number;
  status: "REQUESTED" | "APPROVED" | "REJECTED";
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SettlementSchema = new Schema<SettlementDocument>(
  {
    date: { type: String, required: true, index: true },
    expenseIds: [{ type: Schema.Types.ObjectId, ref: "Expense", required: true }],
    paidByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    paidToUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["REQUESTED", "APPROVED", "REJECTED"],
      default: "REQUESTED",
    },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

SettlementSchema.index({ date: 1, paidByUserId: 1, paidToUserId: 1 });

if (models.Settlement) {
  delete models.Settlement;
}

export const Settlement = model<SettlementDocument>(
  "Settlement",
  SettlementSchema
);
