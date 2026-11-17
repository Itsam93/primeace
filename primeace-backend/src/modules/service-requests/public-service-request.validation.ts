import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid service ID.");

const serviceRequestItemSchema = z.object({
  serviceId: objectIdSchema,

  formVersion: z
    .number()
    .int()
    .min(1),

  answers: z.record(
    z.string(),
    z.unknown()
  )
}).strict();

export const createPublicServiceRequestSchema = z.object({
  body: z.object({
    client: z.object({
      fullName: z
        .string()
        .trim()
        .min(2, "Full name must contain at least 2 characters.")
        .max(100),

      email: z
        .email()
        .trim()
        .toLowerCase()
        .optional()
        .or(z.literal("")),

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
    }).strict(),

    items: z
      .array(serviceRequestItemSchema)
      .min(1, "Select at least one service.")
  }).strict()
}).superRefine(({ body }, context) => {
  const serviceIds = body.items.map((item) => item.serviceId);

  if (new Set(serviceIds).size !== serviceIds.length) {
    context.addIssue({
      code: "custom",
      path: ["body", "items"],
      message: "A service can only be selected once per request."
    });
  }
});

export type CreatePublicServiceRequestInput = z.output<
  typeof createPublicServiceRequestSchema
>["body"];
