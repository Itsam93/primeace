import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  LoaderCircle
} from "lucide-react";

import { apiRequest } from "../../lib/api.js";

import type {
  IService,
  IServiceCategory,
  IServiceFormResponse,
  IServiceRequestContact,
  ICreatePublicServiceRequest,
  IPublicServiceRequestConfirmation
} from "../services/types/service.type.js";

import ServiceSelectionStep from "./components/ServiceSelectionStep.js";
import ContactDetailsStep from "./components/ContactDetailsStep.js";
import ServiceDetailsStep from "./components/ServiceDetailsStep.js";
import ReviewStep from "./components/ReviewStep.js";
import RequestConfirmation from "./components/RequestConfirmation.js";

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  "Select services",
  "Contact information",
  "Service details",
  "Review"
];

const STEP_HEADINGS = [
  "What services do you need?",
  "How can we contact you?",
  "Tell us more about your requirements.",
  "Review your request"
];

const STEP_DESCRIPTIONS = [
  "Select one or more services you would like PrimeAce to provide.",
  "Provide your contact details so our team can reach you.",
  "Complete the relevant information for each selected service.",
  "Check your information carefully before submitting."
];

function conditionMatches(
  condition: NonNullable<IServiceFormResponse["fields"][number]["conditions"]>[number],
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

function isFieldVisible(
  field: IServiceFormResponse["fields"][number],
  answers: Record<string, unknown>
): boolean {
  return (field.conditions ?? []).every((condition) =>
    conditionMatches(condition, answers)
  );
}

function isFieldMissing(
  field: IServiceFormResponse["fields"][number],
  value: unknown
): boolean {
  if (field.type === "checkbox") {
    return value !== true;
  }

  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

function ServiceRequestPage() {
  const [searchParams] = useSearchParams();

  const requestedServiceId = searchParams.get("serviceId");

  const [categories, setCategories] = useState<IServiceCategory[]>([]);
  const [selectedServices, setSelectedServices] = useState<IService[]>([]);

  const [contact, setContact] = useState<IServiceRequestContact>({
    fullName: "",
    email: "",
    phone: "",
    organisation: ""
  });

  const [forms, setForms] = useState<
    Record<string, IServiceFormResponse>
  >({});

  const [answers, setAnswers] = useState<
    Record<string, Record<string, unknown>>
  >({});

  const [step, setStep] = useState<Step>(1);

  const [loading, setLoading] = useState(true);
  const [loadingForms, setLoadingForms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [confirmation, setConfirmation] =
    useState<IPublicServiceRequestConfirmation | null>(null);

  useEffect(() => {
    let active = true;

    async function loadServices() {
      try {
        setLoading(true);
        setError("");

        const result = await apiRequest<{
          categories: IServiceCategory[];
        }>("/services");

        if (!active) return;

        setCategories(result.categories);

        if (requestedServiceId) {
          const service = result.categories
            .flatMap((category) => category.services)
            .find((item) => item._id === requestedServiceId);

          if (service) {
            setSelectedServices([service]);
          }
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load available services."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadServices();

    return () => {
      active = false;
    };
  }, [requestedServiceId]);

  const selectedIds = useMemo(
    () => selectedServices.map((service) => service._id),
    [selectedServices]
  );

  useEffect(() => {
    if (step !== 3 || selectedIds.length === 0) {
      return;
    }

    const missingFormIds = selectedIds.filter(
      (serviceId) => !forms[serviceId]
    );

    if (missingFormIds.length === 0) {
      setLoadingForms(false);
      return;
    }

    let active = true;

    async function loadForms() {
      try {
        setLoadingForms(true);
        setError("");

        const results = await Promise.all(
          missingFormIds.map(async (serviceId) => {
            const form = await apiRequest<IServiceFormResponse>(
              `/services/${serviceId}/form`
            );

            return [serviceId, form] as const;
          })
        );

        if (active) {
          setForms((current) => ({
            ...current,
            ...Object.fromEntries(results)
          }));
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load service forms."
          );
        }
      } finally {
        if (active) {
          setLoadingForms(false);
        }
      }
    }

    void loadForms();

    return () => {
      active = false;
    };
  }, [step, selectedIds, forms]);

  function toggleService(service: IService) {
    setSelectedServices((current) => {
      const exists = current.some(
        (item) => item._id === service._id
      );

      return exists
        ? current.filter((item) => item._id !== service._id)
        : [...current, service];
    });
  }

  function updateAnswers(
    serviceId: string,
    nextAnswers: Record<string, unknown>
  ) {
    setAnswers((current) => ({
      ...current,
      [serviceId]: nextAnswers
    }));
  }

  function validateServiceDetails(): boolean {
    for (const service of selectedServices) {
      const form = forms[service._id];

      if (!form) {
        setError(`The form for ${service.name} has not loaded.`);
        return false;
      }

      const serviceAnswers = answers[service._id] ?? {};

      for (const field of form.fields) {
        if (
          !isFieldVisible(field, serviceAnswers) ||
          !field.required ||
          field.type === "file"
        ) {
          continue;
        }

        const value = serviceAnswers[field.key];

        if (isFieldMissing(field, value)) {
          setError(
            `Please complete "${field.label}" under ${service.name}.`
          );

          return false;
        }
      }
    }

    return true;
  }

  function goNext() {
    setError("");

    if (step === 1 && selectedServices.length === 0) {
      setError("Please select at least one service.");
      return;
    }

    if (step === 2) {
      if (!contact.fullName.trim() || !contact.phone.trim()) {
        setError("Please provide your full name and phone number.");
        return;
      }

      const email = contact.email?.trim();

      if (
        email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {
        setError("Please provide a valid email address.");
        return;
      }
    }

    if (step === 3 && !validateServiceDetails()) {
      return;
    }

    setStep((current) => Math.min(current + 1, 4) as Step);
  }

  function goBack() {
    setError("");
    setStep((current) => Math.max(current - 1, 1) as Step);
  }

  async function submitRequest() {
    try {
      setSubmitting(true);
      setError("");

      const items = selectedServices.map((service) => {
        const form = forms[service._id];

        if (!form) {
          throw new Error(
            `The form for ${service.name} is unavailable. Please go back and try again.`
          );
        }

        return {
          serviceId: service._id,
          formVersion: form.version,
          answers: answers[service._id] ?? {}
        };
      });

      const email = contact.email?.trim();
      const organisation = contact.organisation?.trim();

      const payload: ICreatePublicServiceRequest = {
        client: {
          fullName: contact.fullName.trim(),
          phone: contact.phone.trim(),
          ...(email ? { email } : {}),
          ...(organisation ? { organisation } : {})
        },
        items
      };

      const result =
        await apiRequest<IPublicServiceRequestConfirmation>(
          "/service-requests/public",
          {
            method: "POST",
            body: JSON.stringify(payload)
          }
        );

      setConfirmation(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Your request could not be submitted. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <main className="min-h-screen bg-[#F8FAFD] px-6 py-20">
        <RequestConfirmation confirmation={confirmation} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFD]">
      <section className="bg-[#07152F] px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-sm text-blue-200 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to services
          </Link>

          <p className="mt-10 text-xs font-semibold uppercase tracking-[0.25em] text-blue-300">
            Work with PrimeAce
          </p>

          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
            Tell us what you need.
            <span className="block text-blue-300">
              Let's get started.
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
            Share some details about your requirements. Our team
            will review your request and get in touch with you.
          </p>
        </div>
      </section>

      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12">
            <div className="mb-5 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#07152F]">
                Step {step} of 4
              </p>

              <p className="text-xs text-slate-500">
                {STEPS[step - 1]}
              </p>
            </div>

            <div className="flex gap-2">
              {STEPS.map((item, index) => (
                <div
                  key={item}
                  className={`h-1.5 flex-1 rounded-full ${
                    index < step
                      ? "bg-[#1556D6]"
                      : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-[#07152F]">
              {STEP_HEADINGS[step - 1]}
            </h2>

            <p className="mt-2 text-sm leading-7 text-slate-500">
              {STEP_DESCRIPTIONS[step - 1]}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-7 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-sm text-slate-500">
              <LoaderCircle
                className="animate-spin"
                size={20}
              />
              Loading available services...
            </div>
          ) : (
            <>
              {step === 1 && (
                <ServiceSelectionStep
                  categories={categories}
                  selectedServices={selectedServices}
                  onToggle={toggleService}
                />
              )}

              {step === 2 && (
                <ContactDetailsStep
                  contact={contact}
                  onChange={setContact}
                />
              )}

              {step === 3 && (
                loadingForms ? (
                  <div className="flex items-center justify-center gap-3 py-20 text-sm text-slate-500">
                    <LoaderCircle
                      className="animate-spin"
                      size={20}
                    />
                    Loading service forms...
                  </div>
                ) : (
                  <ServiceDetailsStep
                    services={selectedServices}
                    forms={forms}
                    answers={answers}
                    onChange={updateAnswers}
                  />
                )
              )}

              {step === 4 && (
                <ReviewStep
                  services={selectedServices}
                  contact={contact}
                  answers={answers}
                />
              )}
            </>
          )}

          {!loading && (
            <div className="mt-12 flex items-center justify-between border-t border-slate-200 pt-7">
              <button
                type="button"
                disabled={step === 1 || submitting}
                onClick={goBack}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:invisible"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  disabled={loadingForms}
                  onClick={goNext}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1556D6] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1046B5] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={submitRequest}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1556D6] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1046B5] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit request
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default ServiceRequestPage;
