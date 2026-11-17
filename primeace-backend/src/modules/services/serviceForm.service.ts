import mongoose, { Types } from "mongoose";

import { ApiError } from "../../shared/errors/ApiError.js";

import { AuditLog } from "../audit/Auditlog.js";
import { Service } from "../services/Service.js";

import { ServiceForm } from "./ServiceForm.js";

import type {
  CreateServiceFormInput,
  UpdateServiceFormInput
} from "./serviceForm.validation.js";

interface AuditMetadata {
  ipAddress: string | null;
  userAgent: string | null;
}

interface CreateServiceFormOptions {
  serviceId: string;
  input: CreateServiceFormInput;
  adminId: string;
  auditMetadata: AuditMetadata;
}

interface UpdateServiceFormOptions {
  serviceId: string;
  formId: string;
  input: UpdateServiceFormInput;
  adminId: string;
  auditMetadata: AuditMetadata;
}

interface GetServiceFormOptions {
  serviceId: string;
  formId: string;
}

interface ListServiceFormsOptions {
  serviceId: string;
}

interface PublishServiceFormOptions {
  serviceId: string;
  formId: string;
  adminId: string;
  auditMetadata: AuditMetadata;
}

function assertObjectId(
  value: string,
  field: string
): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${field}.`);
  }

  return new Types.ObjectId(value);
}

async function getServiceOrThrow(
  serviceId: Types.ObjectId,
  session?: mongoose.ClientSession
) {
  let query = Service.findOne({
    _id: serviceId,
    isDeleted: false
  });

  if (session) {
    query = query.session(session);
  }

  const service = await query;

  if (!service) {
    throw new ApiError(404, "Service not found.");
  }

  return service;
}

async function getServiceFormOrThrow(
  serviceId: Types.ObjectId,
  formId: Types.ObjectId,
  session?: mongoose.ClientSession
) {
  let query = ServiceForm.findOne({
    _id: formId,
    serviceId
  });

  if (session) {
    query = query.session(session);
  }

  const form = await query;

  if (!form) {
    throw new ApiError(404, "Service form not found.");
  }

  return form;
}

function getFormSnapshot(
  form: InstanceType<typeof ServiceForm>
) {
  return {
    serviceId: form.serviceId,
    version: form.version,
    fields: form.fields,
    isActive: form.isActive,
    publishedAt: form.publishedAt ?? null
  };
}

export async function getServiceForm(
  serviceId: string
) {
  const id = assertObjectId(serviceId, "service ID");

  await getServiceOrThrow(id);

  const [activeForm, latestForm] = await Promise.all([
    ServiceForm.findOne({
      serviceId: id,
      isActive: true
    }).lean(),

    ServiceForm.findOne({
      serviceId: id
    })
      .sort({ version: -1 })
      .lean()
  ]);

  return {
    activeForm,
    latestForm
  };
}

export async function getServiceFormVersion(
  options: GetServiceFormOptions
) {
  const serviceId = assertObjectId(
    options.serviceId,
    "service ID"
  );

  const formId = assertObjectId(
    options.formId,
    "form ID"
  );

  await getServiceOrThrow(serviceId);

  const form = await ServiceForm.findOne({
    _id: formId,
    serviceId
  }).lean();

  if (!form) {
    throw new ApiError(404, "Service form not found.");
  }

  return form;
}

export async function listServiceForms(
  options: ListServiceFormsOptions
) {
  const serviceId = assertObjectId(
    options.serviceId,
    "service ID"
  );

  await getServiceOrThrow(serviceId);

  const forms = await ServiceForm.find({
    serviceId
  })
    .sort({ version: -1 })
    .lean();

  return {
    forms,
    total: forms.length
  };
}

export async function createServiceForm(
  options: CreateServiceFormOptions
) {
  const serviceId = assertObjectId(
    options.serviceId,
    "service ID"
  );

  const adminId = assertObjectId(
    options.adminId,
    "administrator ID"
  );

  const session = await mongoose.startSession();

  let formId: Types.ObjectId | undefined;

  try {
    await session.withTransaction(async () => {
      await getServiceOrThrow(serviceId, session);

      const latestForm = await ServiceForm.findOne({
        serviceId
      })
        .sort({ version: -1 })
        .session(session);

      const version = (latestForm?.version ?? 0) + 1;

      const [form] = await ServiceForm.create(
        [
          {
            serviceId,
            version,
            fields: options.input.fields,
            isActive: false,
            publishedAt: null,
            createdBy: adminId
          }
        ],
        { session }
      );

      if (!form) {
        throw new ApiError(
          500,
          "The service form could not be created."
        );
      }

      formId = form._id;

      await AuditLog.create(
        [
          {
            actorId: adminId,
            action: "service_form.created",
            resourceType: "service_form",
            resourceId: form._id,
            description: `Draft form version ${version} was created.`,
            changes: {
              after: getFormSnapshot(form)
            },
            metadata: null,
            ipAddress: options.auditMetadata.ipAddress,
            userAgent: options.auditMetadata.userAgent
          }
        ],
        { session }
      );
    });
  } catch (error) {
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      throw new ApiError(
        409,
        "A form version already exists for this service. Please try again."
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }

  if (!formId) {
    throw new ApiError(
      500,
      "The service form could not be retrieved."
    );
  }

  return getServiceFormVersion({
    serviceId: serviceId.toString(),
    formId: formId.toString()
  });
}

export async function updateServiceForm(
  options: UpdateServiceFormOptions
) {
  const serviceId = assertObjectId(
    options.serviceId,
    "service ID"
  );

  const formId = assertObjectId(
    options.formId,
    "form ID"
  );

  const adminId = assertObjectId(
    options.adminId,
    "administrator ID"
  );

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await getServiceOrThrow(serviceId, session);

      const form = await getServiceFormOrThrow(
        serviceId,
        formId,
        session
      );

      if (form.isActive || form.publishedAt != null) {
        throw new ApiError(
          409,
          "Published form versions cannot be edited. Create a new version instead."
        );
      }

      const before = getFormSnapshot(form);

      form.set("fields", options.input.fields);

      await form.save({ session });

      await AuditLog.create(
        [
          {
            actorId: adminId,
            action: "service_form.updated",
            resourceType: "service_form",
            resourceId: form._id,
            description: `Draft form version ${form.version} was updated.`,
            changes: {
              before,
              after: getFormSnapshot(form)
            },
            metadata: null,
            ipAddress: options.auditMetadata.ipAddress,
            userAgent: options.auditMetadata.userAgent
          }
        ],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  return getServiceFormVersion({
    serviceId: serviceId.toString(),
    formId: formId.toString()
  });
}

export async function publishServiceForm(
  options: PublishServiceFormOptions
) {
  const serviceId = assertObjectId(
    options.serviceId,
    "service ID"
  );

  const formId = assertObjectId(
    options.formId,
    "form ID"
  );

  const adminId = assertObjectId(
    options.adminId,
    "administrator ID"
  );

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await getServiceOrThrow(serviceId, session);

      const form = await getServiceFormOrThrow(
        serviceId,
        formId,
        session
      );

      if (form.isActive) {
        throw new ApiError(
          422,
          "This service form version is already published."
        );
      }

      const previousActiveForm = await ServiceForm.findOne({
        serviceId,
        isActive: true
      }).session(session);

      const previousSnapshot = previousActiveForm
        ? getFormSnapshot(previousActiveForm)
        : null;

      if (previousActiveForm) {
        previousActiveForm.isActive = false;

        await previousActiveForm.save({ session });
      }

      const before = getFormSnapshot(form);

      form.isActive = true;
      form.publishedAt = form.publishedAt ?? new Date();

      await form.save({ session });

      await AuditLog.create(
        [
          {
            actorId: adminId,
            action: "service_form.published",
            resourceType: "service_form",
            resourceId: form._id,
            description: `Service form version ${form.version} was published.`,
            changes: {
              before: {
                activeForm: previousSnapshot,
                selectedForm: before
              },
              after: {
                activeForm: getFormSnapshot(form)
              }
            },
            metadata: null,
            ipAddress: options.auditMetadata.ipAddress,
            userAgent: options.auditMetadata.userAgent
          }
        ],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  return getServiceFormVersion({
    serviceId: serviceId.toString(),
    formId: formId.toString()
  });
}
