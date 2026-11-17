import { z } from "zod";

export const createClientSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must contain at least 2 characters.")
      .max(100),

    email: z
      .email()
      .trim()
      .toLowerCase()
      .optional(),

    phone: z
      .string()
      .trim()
      .min(7, "A valid phone number is required.")
      .max(20),

    organisation: z
      .string()
      .trim()
      .max(150)
      .optional()
  })
});


export const listClientsSchema = z.object({
  query: z.object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),

    search: z
      .string()
      .trim()
      .max(100)
      .optional(),

    sortBy: z
      .enum([
        "fullName",
        "createdAt",
        "updatedAt"
      ])
      .default("createdAt"),

    sortOrder: z
      .enum(["asc", "desc"])
      .default("desc")
  })
});

export const getClientSchema = z.object({
  params: z.object({
    clientId: z
      .string()
      .regex(
        /^[a-f\d]{24}$/i,
        "Invalid client ID."
      )
  })
});

export type ListClientsQueryInput = z.output<
  typeof listClientsSchema
>["query"];

export type GetClientParams = z.output<
  typeof getClientSchema
>["params"];


export type CreateClientInput = z.output<
  typeof createClientSchema
>["body"];
