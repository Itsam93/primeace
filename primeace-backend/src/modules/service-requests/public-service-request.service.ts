import mongoose from "mongoose";

import { RequestStatus } from "@primeace/shared";

import { ApiError } from "../../shared/errors/ApiError.js";
import { generateServiceRequestReference } from "../../utils/generateServiceRequestReference.js";

import { Client } from "../clients/Client.js";
import { Service } from "../services/Service.js";
import { ServiceCategory } from "../services/ServiceCategory.js";
import { ServiceForm } from "../services/ServiceForm.js";

import { ServiceRequest } from "./ServiceRequest.js";

import type { CreatePublicServiceRequestInput } from "./public-service-request.validation.js";

type Answers = Record<string, unknown>;

interface ServiceFormOption {
  value: string;
}

interface ServiceFormCondition {
  fieldKey: string;
  operator: string;
  value: unknown;
}

interface ServiceFormField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  options?: ServiceFormOption[] | null;
  conditions?: ServiceFormCondition[] | null;
  validation?: {
    minLength?: number | null;
    maxLength?: number | null;
    min?: number | null;
    max?: number | null;
    pattern?: string | null;
  } | null;
}

interface FormField extends ServiceFormField {}

interface ServiceRequestResult {
  reference: string;
  submittedAt: Date;
}

function isEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

function conditionMatches(
  condition: ServiceFormCondition,
  answers: Answers
): boolean {
  const answer = answers[condition.fieldKey];
  const expected = condition.value;

  switch (condition.operator) {
    case "equals":
      return answer === expected;

    case "not_equals":
      return answer !== expected;

    case "contains":
      return (
        (Array.isArray(answer) &&
          answer.some((item) => Object.is(item, expected))) ||
        (typeof answer === "string" &&
          typeof expected === "string" &&
          answer.includes(expected))
      );

    case "not_contains":
      return !(
        (Array.isArray(answer) &&
          answer.some((item) => Object.is(item, expected))) ||
        (typeof answer === "string" &&
          typeof expected === "string" &&
          answer.includes(expected))
      );

    default:
      return false;
  }
}

function isFieldVisible(
  field: FormField,
  answers: Answers
): boolean {
  return (field.conditions ?? []).every((condition) =>
    conditionMatches(condition, answers)
  );
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const timestamp = Date.parse(`${value}T00:00:00.000Z`);

  if (Number.isNaN(timestamp)) {
    return false;
  }

  return (
    new Date(timestamp).toISOString().slice(0, 10) === value
  );
}

function validateFieldAnswer(
  field: FormField,
  value: unknown
): void {
  if (isEmpty(value)) {
    if (field.required) {
      throw new ApiError(400, `${field.label} is required.`);
    }

    return;
  }

  const validation = field.validation;

  const optionValues = (field.options ?? []).map(
    (option) => option.value
  );

  switch (field.type) {
    case "text":
    case "textarea":
    case "email":
    case "tel":
    case "date": {
      if (typeof value !== "string") {
        throw new ApiError(
          400,
          `${field.label} must be a text value.`
        );
      }

      if (field.type === "email" && !isValidEmail(value)) {
        throw new ApiError(
          400,
          `${field.label} must be a valid email address.`
        );
      }

      if (field.type === "date" && !isValidDate(value)) {
        throw new ApiError(
          400,
          `${field.label} must be a valid date.`
        );
      }

      if (
        validation?.minLength != null &&
        value.length < validation.minLength
      ) {
        throw new ApiError(
          400,
          `${field.label} must contain at least ${validation.minLength} characters.`
        );
      }

      if (
        validation?.maxLength != null &&
        value.length > validation.maxLength
      ) {
        throw new ApiError(
          400,
          `${field.label} must not exceed ${validation.maxLength} characters.`
        );
      }

      if (validation?.pattern) {
        let pattern: RegExp;

        try {
          pattern = new RegExp(validation.pattern);
        } catch {
          throw new ApiError(
            500,
            `The published validation pattern for "${field.label}" is invalid.`
          );
        }

        if (!pattern.test(value)) {
          throw new ApiError(
            400,
            `${field.label} has an invalid format.`
          );
        }
      }

      return;
    }

    case "number": {
      if (
        typeof value !== "number" ||
        !Number.isFinite(value)
      ) {
        throw new ApiError(
          400,
          `${field.label} must be a valid number.`
        );
      }

      if (
        validation?.min != null &&
        value < validation.min
      ) {
        throw new ApiError(
          400,
          `${field.label} must be at least ${validation.min}.`
        );
      }

      if (
        validation?.max != null &&
        value > validation.max
      ) {
        throw new ApiError(
          400,
          `${field.label} must not exceed ${validation.max}.`
        );
      }

      return;
    }

    case "select":
    case "radio": {
      if (
        typeof value !== "string" ||
        !optionValues.includes(value)
      ) {
        throw new ApiError(
          400,
          `Select a valid option for ${field.label}.`
        );
      }

      return;
    }

    case "multiselect": {
      if (
        !Array.isArray(value) ||
        !value.every(
          (item) =>
            typeof item === "string" &&
            optionValues.includes(item)
        )
      ) {
        throw new ApiError(
          400,
          `Select valid options for ${field.label}.`
        );
      }

      return;
    }

    case "checkbox": {
      if (typeof value !== "boolean") {
        throw new ApiError(
          400,
          `${field.label} must be a valid checkbox value.`
        );
      }

      if (field.required && value !== true) {
        throw new ApiError(
          400,
          `${field.label} must be accepted.`
        );
      }

      return;
    }

    default:
      throw new ApiError(
        400,
        `Unsupported field type for ${field.label}.`
      );
  }
}

function validateFormAnswers(
  fields: FormField[],
  submittedAnswers: Answers
): Answers {
  const answerableFields = fields.filter(
    (field) => field.type !== "file"
  );

  const allowedKeys = new Set(
    answerableFields.map((field) => field.key)
  );

  for (const key of Object.keys(submittedAnswers)) {
    if (!allowedKeys.has(key)) {
      throw new ApiError(
        400,
        `The submitted form contains an unknown field: ${key}.`
      );
    }
  }

  const validatedAnswers: Answers = {};

  for (const field of answerableFields) {
    if (!isFieldVisible(field, submittedAnswers)) {
      continue;
    }

    const value = submittedAnswers[field.key];

    validateFieldAnswer(field, value);

    if (value !== undefined) {
      validatedAnswers[field.key] = value;
    }
  }

  return validatedAnswers;
}

function normalizePhone(phone: string): string {
  return phone.trim().replace(/[^\d+]/g, "");
}

function normalizeFormFields(
  fields: ServiceFormField[]
): FormField[] {
  return fields.map((field: ServiceFormField) => ({
    key: field.key,
    label: field.label,
    type: field.type,
    required: field.required,

    options: (field.options ?? []).map(
      (option: ServiceFormOption) => ({
        value: option.value
      })
    ),

    conditions: (field.conditions ?? []).map(
      (condition: ServiceFormCondition) => ({
        fieldKey: condition.fieldKey,
        operator: condition.operator,
        value: condition.value
      })
    ),

    validation: field.validation
      ? {
          minLength: field.validation.minLength ?? null,
          maxLength: field.validation.maxLength ?? null,
          min: field.validation.min ?? null,
          max: field.validation.max ?? null,
          pattern: field.validation.pattern ?? null
        }
      : null
  }));
}

export async function createPublicServiceRequest(
  input: CreatePublicServiceRequestInput
): Promise<ServiceRequestResult> {
  const session = await mongoose.startSession();

  try {
    const result = await session.withTransaction<ServiceRequestResult>(
      async () => {
        const requestItems = [];

        for (const item of input.items) {
          const service = await Service.findOne({
            _id: item.serviceId,
            isActive: true,
            isDeleted: false
          }).session(session);

          if (!service) {
            throw new ApiError(
              400,
              "One or more selected services are unavailable."
            );
          }

          const category = await ServiceCategory.findOne({
            _id: service.categoryId,
            isActive: true,
            isDeleted: false
          }).session(session);

          if (!category) {
            throw new ApiError(
              400,
              "One or more selected services are unavailable."
            );
          }

          const form = await ServiceForm.findOne({
            serviceId: service._id,
            isActive: true,
            version: item.formVersion
          }).session(session);

          if (!form) {
            throw new ApiError(
              409,
              `The form for ${service.name} has changed. Please refresh and try again.`
            );
          }

          const fields = normalizeFormFields(
            form.fields as unknown as ServiceFormField[]
          );

          const answers = validateFormAnswers(
            fields,
            item.answers
          );

          requestItems.push({
            serviceId: service._id,
            serviceName: service.name,
            categoryId: category._id,
            categoryName: category.name,
            formVersion: form.version,
            answers,
            fileIds: []
          });
        }

        const email =
          input.client.email?.trim().toLowerCase() || null;

        const normalizedPhone = normalizePhone(
          input.client.phone
        );

        const existingClient = email
          ? await Client.findOne({
              normalizedEmail: email,
              isDeleted: false
            }).session(session)
          : null;

        const client = existingClient ?? new Client({
          fullName: input.client.fullName,
          email,
          normalizedEmail: email,
          phone: input.client.phone.trim(),
          normalizedPhone,
          organisation:
            input.client.organisation?.trim() || null
        });

        if (existingClient) {
          client.fullName = input.client.fullName;
          client.email = email;
          client.phone = input.client.phone.trim();
          client.normalizedPhone = normalizedPhone;
          client.organisation =
            input.client.organisation?.trim() || null;
        }

        await client.save({ session });

        const reference = generateServiceRequestReference();
        const submittedAt = new Date();

        const serviceRequest = new ServiceRequest({
          reference,
          clientId: client._id,
          clientSnapshot: {
            fullName: client.fullName,
            email: client.email ?? null,
            phone: client.phone,
            organisation: client.organisation ?? null
          },
          items: requestItems,
          status: RequestStatus.NEW,
          submittedAt
        });

        await serviceRequest.save({ session });

        return {
          reference,
          submittedAt
        };
      }
    );

    if (!result) {
      throw new ApiError(
        500,
        "The service request could not be completed."
      );
    }

    return result;
  } finally {
    await session.endSession();
  }
}
