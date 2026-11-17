import {
  useCallback,
  useEffect,
  useState
} from "react";

import type {
  IServiceFormField,
  ServiceFormFieldType,
  FormConditionOperator
} from "@primeace/shared";

import {
  Link,
  useParams
} from "react-router-dom";

import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  LoaderCircle,
  Plus,
  Save,
  Send,
  Trash2
} from "lucide-react";

import { ApiError } from "../../../lib/api.js";

import {
  createServiceForm,
  getAdminServiceById,
  getAdminServiceForm,
  getAdminServiceFormVersions,
  publishServiceForm,
  updateServiceForm
} from "../services/service.service.js";

import type {
  IAdminService,
  IAdminServiceForm
} from "../types/service.type.js";

const FIELD_TYPES: {
  value: ServiceFormFieldType;
  label: string;
}[] = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "email", label: "Email address" },
  { value: "tel", label: "Phone number" },
  { value: "number", label: "Number" },
  { value: "select", label: "Dropdown" },
  { value: "multiselect", label: "Multiple selection" },
  { value: "radio", label: "Radio buttons" },
  { value: "checkbox", label: "Checkboxes" },
  { value: "date", label: "Date" },
  { value: "file", label: "File upload" }
];

const CONDITION_OPERATORS: {
  value: FormConditionOperator;
  label: string;
}[] = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Does not equal" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Does not contain" }
];

const OPTION_FIELD_TYPES: ServiceFormFieldType[] = [
  "select",
  "multiselect",
  "radio",
  "checkbox"
];

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass =
  "mb-1.5 block text-sm font-medium text-slate-700";

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

function createEmptyField(
  displayOrder: number
): IServiceFormField {
  return {
    key: `field_${displayOrder + 1}`,
    label: "",
    type: "text",
    required: false,
    displayOrder,
    options: [],
    conditions: [],
    acceptedMimeTypes: []
  };
}

function normaliseFields(
  fields: IServiceFormField[]
): IServiceFormField[] {
  return fields.map((field, index) => ({
    ...field,
    displayOrder: index,
    options: field.options ?? [],
    conditions: field.conditions ?? [],
    acceptedMimeTypes: field.acceptedMimeTypes ?? []
  }));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function isOptionField(type: ServiceFormFieldType): boolean {
  return OPTION_FIELD_TYPES.includes(type);
}

function isFileField(type: ServiceFormFieldType): boolean {
  return type === "file";
}

function isTextField(type: ServiceFormFieldType): boolean {
  return [
    "text",
    "textarea",
    "email",
    "tel"
  ].includes(type);
}

function isNumberField(type: ServiceFormFieldType): boolean {
  return type === "number";
}

function ServiceFormBuilderPage() {
  const { serviceId } = useParams<{ serviceId: string }>();

  const [service, setService] = useState<IAdminService | null>(null);
  const [versions, setVersions] = useState<IAdminServiceForm[]>([]);
  const [activeForm, setActiveForm] = useState<IAdminServiceForm | null>(null);
  const [draftForm, setDraftForm] = useState<IAdminServiceForm | null>(null);

  const [fields, setFields] = useState<IServiceFormField[]>([]);
  const [expandedField, setExpandedField] = useState<number | null>(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPage = useCallback(async () => {
    if (!serviceId) {
      setError("A service ID was not provided.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [
        serviceResult,
        overviewResult,
        versionsResult
      ] = await Promise.all([
        getAdminServiceById(serviceId),
        getAdminServiceForm(serviceId),
        getAdminServiceFormVersions(serviceId)
      ]);

      setService(serviceResult);
      setActiveForm(overviewResult.activeForm);

      const latest = overviewResult.latestForm;

      if (latest && !latest.isActive && !latest.publishedAt) {
        setDraftForm(latest);
        setFields(normaliseFields(latest.fields));
      } else {
        setDraftForm(null);

        const sourceFields =
          latest?.fields ?? overviewResult.activeForm?.fields ?? [];

        setFields(normaliseFields(sourceFields));
      }

      setVersions(versionsResult.forms);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const updateField = useCallback((
    index: number,
    updates: Partial<IServiceFormField>
  ) => {
    setFields((current) =>
      current.map((field, fieldIndex) =>
        fieldIndex === index
          ? { ...field, ...updates }
          : field
      )
    );
  }, []);

  const addField = () => {
    if (fields.length >= 100) {
      setError("A form cannot contain more than 100 fields.");
      return;
    }

    const nextField = createEmptyField(fields.length);

    setFields((current) => [
      ...current,
      nextField
    ]);

    setExpandedField(fields.length);
    setError("");
    setSuccess("");
  };

  const duplicateField = (index: number) => {
    if (fields.length >= 100) {
      setError("A form cannot contain more than 100 fields.");
      return;
    }

    const source = fields[index];

    if (!source) {
      return;
    }

    const duplicate: IServiceFormField = {
      ...source,
      key: `${source.key}_copy`,
      label: `${source.label} (copy)`,
      displayOrder: index + 1,
      options: source.options?.map((option) => ({ ...option })) ?? [],
      conditions: source.conditions?.map((condition) => ({ ...condition })) ?? [],
      acceptedMimeTypes: [...(source.acceptedMimeTypes ?? [])]
    };

    setFields((current) => {
      const next = [...current];
      next.splice(index + 1, 0, duplicate);

      return normaliseFields(next);
    });

    setExpandedField(index + 1);
    setError("");
    setSuccess("");
  };

  const removeField = (index: number) => {
    setFields((current) =>
      normaliseFields(
        current.filter((_, fieldIndex) => fieldIndex !== index)
      )
    );

    setExpandedField(null);
    setSuccess("");
  };

  const moveField = (index: number, direction: -1 | 1) => {
    const destination = index + direction;

    if (destination < 0 || destination >= fields.length) {
      return;
    }

    setFields((current) => {
      const next = [...current];

      const currentField = next[index];
      const destinationField = next[destination];

      if (!currentField || !destinationField) {
        return current;
      }

      next[index] = destinationField;
      next[destination] = currentField;

      return normaliseFields(next);
    });

    setExpandedField(destination);
  };

  const updateOption = (
    fieldIndex: number,
    optionIndex: number,
    property: "label" | "value",
    value: string
  ) => {
    const field = fields[fieldIndex];

    if (!field) {
      return;
    }

    const options = [...(field.options ?? [])];

    const option = options[optionIndex];

    if (!option) {
      return;
    }

    options[optionIndex] = {
      ...option,
      [property]: value
    };

    updateField(fieldIndex, { options });
  };

  const addOption = (fieldIndex: number) => {
    const field = fields[fieldIndex];

    if (!field) {
      return;
    }

    const options = [
      ...(field.options ?? []),
      {
        label: "",
        value: ""
      }
    ];

    updateField(fieldIndex, { options });
  };

  const removeOption = (
    fieldIndex: number,
    optionIndex: number
  ) => {
    const field = fields[fieldIndex];

    if (!field) {
      return;
    }

    const options = (field.options ?? []).filter(
      (_, index) => index !== optionIndex
    );

    updateField(fieldIndex, { options });
  };

  const addCondition = (fieldIndex: number) => {
    const field = fields[fieldIndex];

    if (!field) {
      return;
    }

    const conditions = [
      ...(field.conditions ?? []),
      {
        fieldKey: "",
        operator: "equals" as FormConditionOperator,
        value: ""
      }
    ];

    updateField(fieldIndex, { conditions });
  };

  const updateCondition = (
    fieldIndex: number,
    conditionIndex: number,
    property: "fieldKey" | "operator" | "value",
    value: string
  ) => {
    const field = fields[fieldIndex];

    if (!field) {
      return;
    }

    const conditions = [...(field.conditions ?? [])];

    const condition = conditions[conditionIndex];

    if (!condition) {
      return;
    }

    conditions[conditionIndex] = {
      ...condition,
      [property]: value
    };

    updateField(fieldIndex, { conditions });
  };

  const removeCondition = (
    fieldIndex: number,
    conditionIndex: number
  ) => {
    const field = fields[fieldIndex];

    if (!field) {
      return;
    }

    const conditions = (field.conditions ?? []).filter(
      (_, index) => index !== conditionIndex
    );

    updateField(fieldIndex, { conditions });
  };

  const validateFields = (): string | null => {
    if (fields.length === 0) {
      return "Add at least one field to the form.";
    }

    if (fields.length > 100) {
      return "A form cannot contain more than 100 fields.";
    }

    const keys = new Set<string>();

    for (const field of fields) {
      const key = field.key.trim();

      if (!key) {
        return `Enter a field key for "${field.label || "Untitled field"}".`;
      }

      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
        return `The field key "${key}" must start with a letter and contain only letters, numbers, and underscores.`;
      }

      if (keys.has(key)) {
        return `The field key "${key}" is used more than once.`;
      }

      keys.add(key);

      if (!field.label.trim()) {
        return `Enter a label for field "${key}".`;
      }

      if (isOptionField(field.type)) {
        if (!field.options?.length) {
          return `"${field.label}" requires at least one option.`;
        }

        const values = field.options.map((option) => option.value.trim());

        if (values.some((value) => !value)) {
          return `Every option in "${field.label}" must have a value.`;
        }

        if (new Set(values).size !== values.length) {
          return `Option values in "${field.label}" must be unique.`;
        }
      }

      if (field.validation) {
        const validation = field.validation;

        if (
          validation.minLength !== undefined &&
          validation.maxLength !== undefined &&
          validation.minLength > validation.maxLength
        ) {
          return `The minimum length cannot exceed the maximum length in "${field.label}".`;
        }

        if (
          validation.min !== undefined &&
          validation.max !== undefined &&
          validation.min > validation.max
        ) {
          return `The minimum value cannot exceed the maximum value in "${field.label}".`;
        }

        if (validation.pattern) {
          try {
            new RegExp(validation.pattern);
          } catch {
            return `The regular expression in "${field.label}" is invalid.`;
          }
        }
      }

      if (isFileField(field.type)) {
        if (
          field.maxFiles !== undefined &&
          field.maxFiles !== null &&
          field.maxFiles < 1
        ) {
          return `The maximum file count for "${field.label}" must be at least 1.`;
        }

        if (
          field.maxFileSizeBytes !== undefined &&
          field.maxFileSizeBytes !== null &&
          field.maxFileSizeBytes < 1
        ) {
          return `The maximum file size for "${field.label}" must be at least 1 byte.`;
        }
      }
    }

    for (const field of fields) {
      for (const condition of field.conditions ?? []) {
        if (!keys.has(condition.fieldKey)) {
          return `The visibility condition for "${field.label}" references a field that does not exist.`;
        }

        if (condition.fieldKey === field.key) {
          return `"${field.label}" cannot depend on itself.`;
        }
      }
    }

    return null;
  };

  const persistDraft = async (): Promise<IAdminServiceForm> => {
    if (!serviceId) {
      throw new Error("A service ID was not provided.");
    }

    const validationError = validateFields();

    if (validationError) {
      throw new Error(validationError);
    }

    const payload = {
      fields: normaliseFields(fields)
    };

    let savedForm: IAdminServiceForm;

    if (draftForm) {
      savedForm = await updateServiceForm(
        serviceId,
        draftForm._id,
        payload
      );
    } else {
      savedForm = await createServiceForm(
        serviceId,
        payload
      );
    }

    setDraftForm(savedForm);
    setFields(normaliseFields(savedForm.fields));

    return savedForm;
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const savedForm = await persistDraft();

      setSuccess(
        `Version ${savedForm.version} has been saved as a draft.`
      );

      const versionsResult = await getAdminServiceFormVersions(
        serviceId!
      );

      setVersions(versionsResult.forms);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!serviceId) {
      return;
    }

    const confirmed = window.confirm(
      "Publish this form version? It will become the active form used for new service requests."
    );

    if (!confirmed) {
      return;
    }

    setPublishing(true);
    setError("");
    setSuccess("");

    try {
      const savedForm = await persistDraft();

      const publishedForm = await publishServiceForm(
        serviceId,
        savedForm._id
      );

      setActiveForm(publishedForm);
      setDraftForm(null);
      setFields(normaliseFields(publishedForm.fields));

      const [
        overviewResult,
        versionsResult
      ] = await Promise.all([
        getAdminServiceForm(serviceId),
        getAdminServiceFormVersions(serviceId)
      ]);

      setActiveForm(overviewResult.activeForm);
      setVersions(versionsResult.forms);

      setSuccess(
        `Version ${publishedForm.version} has been published successfully.`
      );
    } catch (publishError) {
      setError(getErrorMessage(publishError));
    } finally {
      setPublishing(false);
    }
  };

  const startNewDraft = () => {
    const source = draftForm?.fields ??
      activeForm?.fields ??
      versions[0]?.fields ??
      [];

    setFields(normaliseFields(source));
    setDraftForm(null);
    setExpandedField(0);
    setError("");
    setSuccess("");
  };

  const updateValidation = (
    fieldIndex: number,
    property: "minLength" | "maxLength" | "min" | "max" | "pattern",
    value: string
  ) => {
    const field = fields[fieldIndex];

    if (!field) {
      return;
    }

    const validation = {
      ...(field.validation ?? {})
    };

    if (value === "") {
      delete validation[property];
    } else if (property === "pattern") {
      validation.pattern = value;
    } else {
      validation[property] = Number(value);
    }

    updateField(fieldIndex, { validation });
  };

  const updateFileNumber = (
    fieldIndex: number,
    property: "maxFiles" | "maxFileSizeBytes",
    value: string
  ) => {
    const field = fields[fieldIndex];

    if (!field) {
      return;
    }

    if (value === "") {
      const updated = { ...field };
      delete updated[property];

      updateField(fieldIndex, updated);
      return;
    }

    updateField(fieldIndex, {
      [property]: Number(value)
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading service form...
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />

          <div>
            <h2 className="font-semibold text-red-900">
              Unable to load service
            </h2>

            <p className="mt-1 text-sm text-red-700">
              {error || "The requested service could not be found."}
            </p>

            <Link
              to="/admin/services"
              className="mt-4 inline-flex text-sm font-medium text-blue-700 hover:underline"
            >
              Return to services
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isEditingDraft = Boolean(draftForm);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/admin/services"
            className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to services
          </Link>

          <h1 className="text-2xl font-semibold tracking-tight text-[#07152F]">
            Service form
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Configure the information clients must provide when requesting this service.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || publishing}
            className={`${buttonClass} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
          >
            {saving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            Save draft
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={saving || publishing || fields.length === 0}
            className={`${buttonClass} bg-[#1556D6] text-white hover:bg-blue-700`}
          >
            {publishing ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}

            Publish form
          </button>
        </div>
      </div>

      {/* Service information */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Service
            </p>

            <h2 className="mt-1 text-lg font-semibold text-[#07152F]">
              {service.name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {service.shortDescription}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
              {fields.length} {fields.length === 1 ? "field" : "fields"}
            </span>

            {activeForm && (
              <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
                Active version {activeForm.version}
              </span>
            )}

            {isEditingDraft && draftForm && (
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                Draft version {draftForm.version}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <Check className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Version history */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-[#07152F]">
              Form versions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Published versions are preserved. Changes are made in new drafts.
            </p>
          </div>

          <button
            type="button"
            onClick={startNewDraft}
            disabled={saving || publishing || !activeForm && !versions.length}
            className={`${buttonClass} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
          >
            <Plus className="h-4 w-4" />
            New version
          </button>
        </div>

        {versions.length > 0 ? (
          <div className="mt-4 divide-y divide-slate-100">
            {versions.map((version) => {
              const isActive = version.isActive;
              const isCurrentDraft =
                draftForm?._id === version._id;

              return (
                <div
                  key={version._id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <FileText className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        Version {version.version}
                      </p>

                      <p className="text-xs text-slate-500">
                        {version.publishedAt
                          ? `Published ${new Date(version.publishedAt).toLocaleDateString()}`
                          : "Unpublished draft"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isActive && (
                      <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                        Active
                      </span>
                    )}

                    {isCurrentDraft && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        Editing
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
            No form versions have been created for this service yet.
          </p>
        )}
      </section>

      {/* Form builder */}
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#07152F]">
              Form fields
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add and configure the fields clients will complete.
            </p>
          </div>

          <button
            type="button"
            onClick={addField}
            disabled={fields.length >= 100}
            className={`${buttonClass} bg-[#1556D6] text-white hover:bg-blue-700`}
          >
            <Plus className="h-4 w-4" />
            Add field
          </button>
        </div>

        {fields.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FileText className="h-6 w-6" />
            </div>

            <h3 className="mt-4 font-semibold text-[#07152F]">
              No fields added yet
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Start building your service form by adding the first field.
            </p>

            <button
              type="button"
              onClick={addField}
              className={`${buttonClass} mt-5 bg-[#1556D6] text-white hover:bg-blue-700`}
            >
              <Plus className="h-4 w-4" />
              Add first field
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => {
              const expanded = expandedField === index;

              return (
                <div
                  key={`${index}-${field.key}`}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600">
                      {index + 1}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedField(expanded ? null : index)
                      }
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm font-semibold text-[#07152F]">
                        {field.label || "Untitled field"}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {FIELD_TYPES.find(
                          (item) => item.value === field.type
                        )?.label ?? field.type}
                        {field.required ? " · Required" : " · Optional"}
                      </p>
                    </button>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveField(index, -1)}
                        disabled={index === 0}
                        title="Move up"
                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => moveField(index, 1)}
                        disabled={index === fields.length - 1}
                        title="Move down"
                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => duplicateField(index)}
                        title="Duplicate field"
                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                      >
                        <Copy className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        title="Delete field"
                        className="rounded-md p-2 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedField(expanded ? null : index)
                        }
                        title={expanded ? "Collapse field" : "Expand field"}
                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                      >
                        {expanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="space-y-6 border-t border-slate-100 p-5">
                      {/* Basic settings */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className={labelClass}>
                            Field label
                          </label>

                          <input
                            className={inputClass}
                            value={field.label}
                            onChange={(event) =>
                              updateField(index, {
                                label: event.target.value
                              })
                            }
                            placeholder="e.g. Project topic"
                          />
                        </div>

                        <div>
                          <label className={labelClass}>
                            Field key
                          </label>

                          <input
                            className={inputClass}
                            value={field.key}
                            onChange={(event) =>
                              updateField(index, {
                                key: event.target.value
                              })
                            }
                            placeholder="e.g. project_topic"
                          />

                          <p className="mt-1 text-xs text-slate-400">
                            Letters, numbers and underscores. Must start with a letter.
                          </p>
                        </div>

                        <div>
                          <label className={labelClass}>
                            Field type
                          </label>

                          <select
                            className={inputClass}
                            value={field.type}
                            onChange={(event) => {
                              const type = event.target.value as ServiceFormFieldType;

                              updateField(index, {
                                type,
                                options: isOptionField(type)
                                  ? field.options?.length
                                    ? field.options
                                    : [{ label: "", value: "" }]
                                  : [],
                                acceptedMimeTypes: isFileField(type)
                                  ? field.acceptedMimeTypes ?? []
                                  : []
                              });
                            }}
                          >
                            {FIELD_TYPES.map((type) => (
                              <option
                                key={type.value}
                                value={type.value}
                              >
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center">
                          <label className="flex cursor-pointer items-center gap-3">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(event) =>
                                updateField(index, {
                                  required: event.target.checked
                                })
                              }
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />

                            <span className="text-sm font-medium text-slate-700">
                              Required field
                            </span>
                          </label>
                        </div>

                        <div>
                          <label className={labelClass}>
                            Placeholder
                          </label>

                          <input
                            className={inputClass}
                            value={field.placeholder ?? ""}
                            onChange={(event) =>
                              updateField(index, {
                                placeholder: event.target.value
                              })
                            }
                            placeholder="Enter placeholder text"
                          />
                        </div>

                        <div>
                          <label className={labelClass}>
                            Help text
                          </label>

                          <input
                            className={inputClass}
                            value={field.helpText ?? ""}
                            onChange={(event) =>
                              updateField(index, {
                                helpText: event.target.value
                              })
                            }
                            placeholder="Explain what the client should enter"
                          />
                        </div>
                      </div>

                      {/* Options */}
                      {isOptionField(field.type) && (
                        <div className="border-t border-slate-100 pt-5">
                          <div className="mb-3 flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-semibold text-[#07152F]">
                                Field options
                              </h3>

                              <p className="mt-1 text-xs text-slate-500">
                                Add the choices clients can select.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => addOption(index)}
                              className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800"
                            >
                              <Plus className="h-4 w-4" />
                              Add option
                            </button>
                          </div>

                          <div className="space-y-2">
                            {(field.options ?? []).map((option, optionIndex) => (
                              <div
                                key={optionIndex}
                                className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
                              >
                                <input
                                  className={inputClass}
                                  value={option.label}
                                  onChange={(event) =>
                                    updateOption(
                                      index,
                                      optionIndex,
                                      "label",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Option label"
                                />

                                <input
                                  className={inputClass}
                                  value={option.value}
                                  onChange={(event) =>
                                    updateOption(
                                      index,
                                      optionIndex,
                                      "value",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Option value"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeOption(index, optionIndex)
                                  }
                                  title="Remove option"
                                  className="flex h-10 w-10 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Text and number validation */}
                      {(isTextField(field.type) || isNumberField(field.type)) && (
                        <div className="border-t border-slate-100 pt-5">
                          <h3 className="mb-3 text-sm font-semibold text-[#07152F]">
                            Validation rules
                          </h3>

                          <div className="grid gap-4 md:grid-cols-2">
                            {isTextField(field.type) && (
                              <>
                                <div>
                                  <label className={labelClass}>
                                    Minimum length
                                  </label>

                                  <input
                                    type="number"
                                    min="0"
                                    className={inputClass}
                                    value={field.validation?.minLength ?? ""}
                                    onChange={(event) =>
                                      updateValidation(
                                        index,
                                        "minLength",
                                        event.target.value
                                      )
                                    }
                                    placeholder="No minimum"
                                  />
                                </div>

                                <div>
                                  <label className={labelClass}>
                                    Maximum length
                                  </label>

                                  <input
                                    type="number"
                                    min="0"
                                    className={inputClass}
                                    value={field.validation?.maxLength ?? ""}
                                    onChange={(event) =>
                                      updateValidation(
                                        index,
                                        "maxLength",
                                        event.target.value
                                      )
                                    }
                                    placeholder="No maximum"
                                  />
                                </div>
                              </>
                            )}

                            {isNumberField(field.type) && (
                              <>
                                <div>
                                  <label className={labelClass}>
                                    Minimum value
                                  </label>

                                  <input
                                    type="number"
                                    className={inputClass}
                                    value={field.validation?.min ?? ""}
                                    onChange={(event) =>
                                      updateValidation(
                                        index,
                                        "min",
                                        event.target.value
                                      )
                                    }
                                    placeholder="No minimum"
                                  />
                                </div>

                                <div>
                                  <label className={labelClass}>
                                    Maximum value
                                  </label>

                                  <input
                                    type="number"
                                    className={inputClass}
                                    value={field.validation?.max ?? ""}
                                    onChange={(event) =>
                                      updateValidation(
                                        index,
                                        "max",
                                        event.target.value
                                      )
                                    }
                                    placeholder="No maximum"
                                  />
                                </div>
                              </>
                            )}

                            {isTextField(field.type) && (
                              <div className="md:col-span-2">
                                <label className={labelClass}>
                                  Regular expression pattern
                                </label>

                                <input
                                  className={inputClass}
                                  value={field.validation?.pattern ?? ""}
                                  onChange={(event) =>
                                    updateValidation(
                                      index,
                                      "pattern",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Optional regular expression"
                                />

                                <p className="mt-1 text-xs text-slate-400">
                                  Use a JavaScript-compatible regular expression.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* File settings */}
                      {isFileField(field.type) && (
                        <div className="border-t border-slate-100 pt-5">
                          <h3 className="mb-3 text-sm font-semibold text-[#07152F]">
                            File restrictions
                          </h3>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className={labelClass}>
                                Accepted MIME types
                              </label>

                              <input
                                className={inputClass}
                                value={(field.acceptedMimeTypes ?? []).join(", ")}
                                onChange={(event) =>
                                  updateField(index, {
                                    acceptedMimeTypes: event.target.value
                                      .split(",")
                                      .map((item) => item.trim())
                                      .filter(Boolean)
                                  })
                                }
                                placeholder="application/pdf, image/jpeg"
                              />

                              <p className="mt-1 text-xs text-slate-400">
                                Separate MIME types with commas.
                              </p>
                            </div>

                            <div>
                              <label className={labelClass}>
                                Maximum number of files
                              </label>

                              <input
                                type="number"
                                min="1"
                                className={inputClass}
                                value={field.maxFiles ?? ""}
                                onChange={(event) =>
                                  updateFileNumber(
                                    index,
                                    "maxFiles",
                                    event.target.value
                                  )
                                }
                                placeholder="No limit configured"
                              />
                            </div>

                            <div>
                              <label className={labelClass}>
                                Maximum file size (bytes)
                              </label>

                              <input
                                type="number"
                                min="1"
                                className={inputClass}
                                value={field.maxFileSizeBytes ?? ""}
                                onChange={(event) =>
                                  updateFileNumber(
                                    index,
                                    "maxFileSizeBytes",
                                    event.target.value
                                  )
                                }
                                placeholder="No limit configured"
                              />

                              <p className="mt-1 text-xs text-slate-400">
                                For example, 5242880 for 5 MB.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Conditional visibility */}
                      <div className="border-t border-slate-100 pt-5">
                        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-[#07152F]">
                              Conditional visibility
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              Show this field based on another field's answer.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => addCondition(index)}
                            className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800"
                          >
                            <Plus className="h-4 w-4" />
                            Add condition
                          </button>
                        </div>

                        {(field.conditions ?? []).length === 0 ? (
                          <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                            This field is always visible.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {(field.conditions ?? []).map((condition, conditionIndex) => (
                              <div
                                key={conditionIndex}
                                className="grid gap-2 rounded-lg bg-slate-50 p-3 md:grid-cols-[1fr_1fr_1fr_auto]"
                              >
                                <select
                                  className={inputClass}
                                  value={condition.fieldKey}
                                  onChange={(event) =>
                                    updateCondition(
                                      index,
                                      conditionIndex,
                                      "fieldKey",
                                      event.target.value
                                    )
                                  }
                                >
                                  <option value="">
                                    Select a field
                                  </option>

                                  {fields
                                    .filter((item) => item.key !== field.key)
                                    .map((item) => (
                                      <option
                                        key={item.key}
                                        value={item.key}
                                      >
                                        {item.label || item.key}
                                      </option>
                                    ))}
                                </select>

                                <select
                                  className={inputClass}
                                  value={condition.operator}
                                  onChange={(event) =>
                                    updateCondition(
                                      index,
                                      conditionIndex,
                                      "operator",
                                      event.target.value
                                    )
                                  }
                                >
                                  {CONDITION_OPERATORS.map((operator) => (
                                    <option
                                      key={operator.value}
                                      value={operator.value}
                                    >
                                      {operator.label}
                                    </option>
                                  ))}
                                </select>

                                <input
                                  className={inputClass}
                                  value={
                                    typeof condition.value === "string"
                                      ? condition.value
                                      : String(condition.value)
                                  }
                                  onChange={(event) =>
                                    updateCondition(
                                      index,
                                      conditionIndex,
                                      "value",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Expected answer"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeCondition(index, conditionIndex)
                                  }
                                  title="Remove condition"
                                  className="flex h-10 w-10 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {(field.conditions ?? []).length > 1 && (
                          <p className="mt-2 text-xs text-slate-400">
                            All conditions must be satisfied for this field to be displayed.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Bottom actions */}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/admin/services"
          className="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          Cancel and return to services
        </Link>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || publishing}
            className={`${buttonClass} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
          >
            {saving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            Save draft
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={saving || publishing || fields.length === 0}
            className={`${buttonClass} bg-[#1556D6] text-white hover:bg-blue-700`}
          >
            {publishing ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}

            Publish form
          </button>
        </div>
      </div>
    </div>
  );
}

export default ServiceFormBuilderPage;
