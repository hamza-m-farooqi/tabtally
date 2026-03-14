import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  createAsAdmin: z.boolean().optional().default(false),
  adminSecret: z.string().optional().nullable(),
});

export const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const expenseSchema = z.object({
  amount: z.number().positive(),
  note: z.string().optional(),
  category: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  participantUserIds: z.array(z.string()).min(0),
  includeMe: z.boolean().default(true),
});
