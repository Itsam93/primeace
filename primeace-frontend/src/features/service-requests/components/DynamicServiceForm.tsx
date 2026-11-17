import type {
  IServiceFormField,
  IFormFieldCondition
} from "@primeace/shared";

interface DynamicServiceFormProps {
  fields: IServiceFormField[];
  answers: Record<string, unknown>;
  onChange: (answers: Record<string, unknown>) => void;
}

function conditionMatches(
  condition: IFormFieldCondition,
  answers: Record<string, unknown>
): boolean {
  const actual = answers[condition.fieldKey];
  const expected = condition.value;

  switch (condition.operator) {
    case "equals":
      return actual === expected;

    case "not_equals":
      return actual !== expected;

    case "contains":
      return Array.isArray(actual)
        ? actual.includes(expected)
        : typeof actual === "string" &&
            actual.includes(String(expected));

    case "not_contains":
      return Array.isArray(actual)
        ? !actual.includes(expected)
        : typeof actual === "string"
          ? !actual.includes(String(expected))
          : true;

    default:
      return false;
  }
}

function isVisible(
  field: IServiceFormField,
  answers: Record<string, unknown>
): boolean {
  if (!field.conditions?.length) return true;

  return field.conditions.every((condition) =>
    conditionMatches(condition, answers)
  );
}

function DynamicServiceForm({
  fields,
  answers,
  onChange
}: DynamicServiceFormProps) {
  function updateAnswer(key: string, value: unknown) {
    onChange({
      ...answers,
      [key]: value
    });
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#07152F] outline-none focus:border-[#1556D6] focus:ring-2 focus:ring-blue-100";

  const sortedFields = [...fields].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  return (
    <div className="space-y-6">
      {sortedFields.map((field) => {
        if (!isVisible(field, answers)) return null;

        const value = answers[field.key];

        if (field.type === "file") {
          return (
            <div
              key={field.key}
              className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5"
            >
              <h4 className="text-sm font-semibold text-[#07152F]">
                {field.label}
              </h4>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {field.helpText ||
                  "If supporting documents are required, please email them to us after submitting your request."}
              </p>
            </div>
          );
        }

        return (
          <div key={field.key}>
            <label className="block text-sm font-medium text-[#07152F]">
              {field.label}
              {field.required && " *"}
            </label>

            {field.type === "textarea" && (
              <textarea
                required={field.required}
                minLength={field.validation?.minLength}
                maxLength={field.validation?.maxLength}
                placeholder={field.placeholder}
                value={String(value ?? "")}
                onChange={(event) =>
                  updateAnswer(field.key, event.target.value)
                }
                className={`${inputClass} min-h-32 resize-y`}
              />
            )}

            {["text", "email", "tel", "number", "date"].includes(
              field.type
            ) && (
              <input
                type={field.type}
                required={field.required}
                placeholder={field.placeholder}
                minLength={field.validation?.minLength}
                maxLength={field.validation?.maxLength}
                min={field.validation?.min}
                max={field.validation?.max}
                pattern={field.validation?.pattern}
                value={String(value ?? "")}
                onChange={(event) =>
                  updateAnswer(
                    field.key,
                    field.type === "number" && event.target.value !== ""
                      ? Number(event.target.value)
                      : event.target.value
                  )
                }
                className={inputClass}
              />
            )}

            {field.type === "select" && (
              <select
                required={field.required}
                value={String(value ?? "")}
                onChange={(event) =>
                  updateAnswer(field.key, event.target.value)
                }
                className={inputClass}
              >
                <option value="">Select an option</option>

                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {field.type === "radio" && (
              <div className="mt-3 space-y-3">
                {field.options?.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 text-sm text-slate-600"
                  >
                    <input
                      type="radio"
                      name={field.key}
                      required={field.required}
                      checked={value === option.value}
                      onChange={() =>
                        updateAnswer(field.key, option.value)
                      }
                      className="accent-[#1556D6]"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            )}

            {field.type === "checkbox" && (
              <label className="mt-3 flex items-center gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  required={field.required}
                  checked={value === true}
                  onChange={(event) =>
                    updateAnswer(field.key, event.target.checked)
                  }
                  className="size-4 accent-[#1556D6]"
                />
                {field.helpText || field.label}
              </label>
            )}

            {field.type === "multiselect" && (
              <div className="mt-3 space-y-3">
                {field.options?.map((option) => {
                  const selected = Array.isArray(value)
                    ? value.includes(option.value)
                    : false;

                  return (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 text-sm text-slate-600"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(event) => {
                          const current = Array.isArray(value)
                            ? value as string[]
                            : [];

                          updateAnswer(
                            field.key,
                            event.target.checked
                              ? [...current, option.value]
                              : current.filter(
                                  (item) => item !== option.value
                                )
                          );
                        }}
                        className="size-4 accent-[#1556D6]"
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            )}

            {field.helpText &&
              !["checkbox", "file"].includes(field.type) && (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {field.helpText}
                </p>
              )}
          </div>
        );
      })}
    </div>
  );
}

export default DynamicServiceForm;