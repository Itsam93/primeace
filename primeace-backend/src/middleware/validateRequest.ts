import type { RequestHandler } from "express";
import { z } from "zod";

export type ValidatedRequest<TSchema extends z.ZodType> =
  z.output<TSchema>;

export function validateRequest<TSchema extends z.ZodType>(
  schema: TSchema
): RequestHandler {
  return (request, response, next) => {
    const result = schema.safeParse({
      body: request.body ?? {},
      params: request.params,
      query: request.query
    });

    if (!result.success) {
      next(result.error);
      return;
    }

    response.locals.validated = result.data;

    next();
  };
}
