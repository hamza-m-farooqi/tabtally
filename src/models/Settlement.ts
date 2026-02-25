import { Schema, model, models, Types } from "mongoose";

export interface SettlementDocument {
  date: string;
  userId: Types.ObjectId;
  withUserId: Types.ObjectId;
  status: "PENDING" | "SETTLED";
  settledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SettlementSchema = new Schema<SettlementDocument>(
  {
    date: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    withUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["PENDING", "SETTLED"],
      default: "PENDING",
    },
    settledAt: { type: Date },
  },
  { timestamps: true }
);

SettlementSchema.index({ date: 1, userId: 1, withUserId: 1 }, { unique: true });

export const Settlement =
  models.Settlement || model<SettlementDocument>("Settlement", SettlementSchema);
