import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z
      .email("Enter a valid email address.")
      .trim()
      .toLowerCase(),

    password: z
      .string()
      .min(1, "Password is required.")
      .max(128, "Password is too long.")
  })
});

export type LoginInput = z.output<typeof loginSchema>["body"];
