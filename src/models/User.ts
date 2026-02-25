import { Schema, model, models } from "mongoose";

export type UserRole = "USER" | "ADMIN";
export type UserStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface UserDocument {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

export const User = models.User || model<UserDocument>("User", UserSchema);
