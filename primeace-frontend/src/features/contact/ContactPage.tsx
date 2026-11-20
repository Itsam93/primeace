import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  LoaderCircle,
  Mail,
  MessageCircle,
  X,
} from "lucide-react";

import { apiRequest } from "../../lib/api.js";
import type {
  IService,
  IServiceCategory,
  IServiceFormResponse,
  IServiceRequestContact,
  ICreatePublicServiceRequest,
  IPublicServiceRequestConfirmation,
} from "../services/types/service.type.js";

import ContactDetailsStep from "../service-requests/components/ContactDetailsStep.js";
import ServiceDetailsStep from "../service-requests/components/ServiceDetailsStep.js";
import RequestSuccessMessage from "../service-requests/components/RequestSuccessMessage.js";

function ContactPage() {
  const [searchParams] = useSearchParams();
  const requestedServiceId = searchParams.get("serviceId");

  const [categories, setCategories] = useState<IServiceCategory[]>([]);
  const [selectedServices, setSelectedServices] = useState<IService[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);

  const [contact, setContact] = useState<IServiceRequestContact>({
    fullName: "",
    email: "",
    phone: "",
    organisation: "",
  });

  const [forms, setForms] = useState<
    Record<string, IServiceFormResponse>
  >({});

  const [answers, setAnswers] = useState<
    Record<string, Record<string, unknown>>
  >({});

  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingForms, setLoadingForms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [confirmation, setConfirmation] =
    useState<IPublicServiceRequestConfirmation | null>(null);

  const selectedIds = useMemo(
    () => selectedServices.map((service) => service._id),
    [selectedServices],
  );

  const selectedCategory = useMemo(
    () => categories.find((category) => category._id === selectedCategoryId),
    [categories, selectedCategoryId],
  );

  const selectedCategoryServiceCount = useMemo(
    () =>
      selectedCategory?.services.filter((service) =>
        selectedIds.includes(service._id),
      ).length ?? 0,
    [selectedCategory, selectedIds],
  );

  // Load available service categories and services.
  useEffect(() => {
    let active = true;

    async function loadServices() {
      try {
        setLoadingServices(true);

        const response = await apiRequest<{
          categories: IServiceCategory[];
        }>("/services");

        if (!active) return;

        setCategories(response.categories);

        // Preselect a service when the page is opened with a serviceId.
        if (requestedServiceId) {
          const category = response.categories.find((item) =>
            item.services.some(
              (service) => service._id === requestedServiceId,
            ),
          );

          const service = category?.services.find(
            (item) => item._id === requestedServiceId,
          );

          if (service && category) {
            setSelectedServices([service]);
            setSelectedCategoryId(category._id);
          }
        }
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load services. Please try again.",
        );
      } finally {
        if (active) setLoadingServices(false);
      }
    }

    loadServices();

    return () => {
      active = false;
    };
  }, [requestedServiceId]);

  // Load the published form for each selected service.
  useEffect(() => {
    if (selectedIds.length === 0) {
      setForms({});
      setAnswers({});
      return;
    }

    let active = true;

    async function loadForms() {
      const missingServiceIds = selectedIds.filter((id) => !forms[id]);

      if (missingServiceIds.length === 0) return;

      try {
        setLoadingForms(true);

        const results = await Promise.all(
          missingServiceIds.map(async (serviceId) => {
            const form = await apiRequest<IServiceFormResponse>(
              `/services/${serviceId}/form`,
            );

            return [serviceId, form] as const;
          }),
        );

        if (!active) return;

        setForms((current) => ({
          ...current,
          ...Object.fromEntries(results),
        }));
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the selected service forms.",
        );
      } finally {
        if (active) setLoadingForms(false);
      }
    }

    loadForms();

    return () => {
      active = false;
    };
  }, [selectedIds, forms]);

  function toggleService(service: IService) {
    setError("");

    setSelectedServices((current) => {
      const alreadySelected = current.some(
        (item) => item._id === service._id,
      );

      if (alreadySelected) {
        return current.filter((item) => item._id !== service._id);
      }

      return [...current, service];
    });
  }

  function removeService(serviceId: string) {
    setSelectedServices((current) =>
      current.filter((service) => service._id !== serviceId),
    );
  }

  function handleContactChange(nextContact: IServiceRequestContact) {
    setContact(nextContact);
  }

  function handleAnswersChange(
    serviceId: string,
    nextAnswers: Record<string, unknown>,
  ) {
    setAnswers((current) => ({
      ...current,
      [serviceId]: nextAnswers,
    }));
  }

  function validateContact(): string {
    if (!contact.fullName.trim()) {
      return "Please enter your full name.";
    }

    if (!contact.phone.trim()) {
      return "Please enter your phone number.";
    }

    if (
      contact.email?.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())
    ) {
      return "Please enter a valid email address.";
    }

    return "";
  }

  function validateServiceDetails(): string {
    for (const service of selectedServices) {
      const form = forms[service._id];

      if (!form) {
        return `The form for ${service.name} is still loading. Please wait.`;
      }

      const serviceAnswers = answers[service._id] ?? {};

      for (const field of form.fields) {
        if (!field.required) continue;

        const conditions = field.conditions ?? [];

        const visible = conditions.every((condition) => {
          const answer = serviceAnswers[condition.fieldKey];

          switch (condition.operator) {
            case "equals":
              return answer === condition.value;

            case "not_equals":
              return answer !== condition.value;

            case "contains":
              return Array.isArray(answer)
                ? answer.includes(condition.value as string)
                : typeof answer === "string" &&
                    answer.includes(String(condition.value));

            case "not_contains":
              return Array.isArray(answer)
                ? !answer.includes(condition.value as string)
                : typeof answer === "string"
                  ? !answer.includes(String(condition.value))
                  : true;

            default:
              return true;
          }
        });

        if (!visible || field.type === "file") continue;

        const value = serviceAnswers[field.key];

        const missing =
          field.type === "checkbox"
            ? value !== true
            : value === undefined ||
              value === null ||
              value === "" ||
              (Array.isArray(value) && value.length === 0);

        if (missing) {
          return `Please complete "${field.label}" under ${service.name}.`;
        }
      }
    }

    return "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (selectedServices.length === 0) {
      setError("Please select at least one service.");
      return;
    }

    const contactError = validateContact();

    if (contactError) {
      setError(contactError);
      return;
    }

    const serviceError = validateServiceDetails();

    if (serviceError) {
      setError(serviceError);
      return;
    }

    // Ensure every selected service has a loaded form before submission.
    const missingForm = selectedServices.find(
      (service) => !forms[service._id],
    );

    if (missingForm) {
      setError(
        `The form for ${missingForm.name} is not available yet. Please wait.`,
      );
      return;
    }

    const payload: ICreatePublicServiceRequest = {
      client: {
        fullName: contact.fullName.trim(),
        phone: contact.phone.trim(),
        ...(contact.email?.trim()
          ? { email: contact.email.trim() }
          : {}),
        ...(contact.organisation?.trim()
          ? { organisation: contact.organisation.trim() }
          : {}),
      },
      items: selectedServices.map((service) => {
        const form = forms[service._id];

        // The missing-form guard above ensures this exists.
        if (!form) {
          throw new Error(`Form unavailable for ${service.name}.`);
        }

        return {
          serviceId: service._id,
          formVersion: form.version,
          answers: answers[service._id] ?? {},
        };
      }),
    };

    try {
      setSubmitting(true);

      const response =
        await apiRequest<IPublicServiceRequestConfirmation>(
          "/service-requests/public",
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );

      setConfirmation(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit your request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="bg-white">
      <section className="bg-[#07152F] px-5 py-16 text-white sm:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-blue-300">
            Contact PrimeAce
          </p>

          <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            Let's discuss your next project.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            Tell us what you need, and we'll get back to you with the
            next steps.
          </p>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          {confirmation && (
            <div className="mb-10">
              <RequestSuccessMessage
                confirmation={confirmation}
                onDismiss={() => setConfirmation(null)}
              />
            </div>
          )}

          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <aside>
              <h2 className="text-2xl font-bold text-[#07152F]">
                Get in touch
              </h2>

              <p className="mt-4 max-w-md leading-7 text-slate-600">
                Whether you need research support, data analysis, business
                reporting or a digital solution, we're ready to help.
              </p>

              <div className="mt-9 space-y-6">
                <a
                  href="mailto:admin@primeace.com"
                  className="flex items-center gap-4 text-slate-700 transition hover:text-blue-700"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <Mail size={20} />
                  </span>

                  <span>
                    <span className="block text-sm text-slate-500">
                      Email
                    </span>
                    <span className="font-medium">
                      admin@primeace.com
                    </span>
                  </span>
                </a>

                <a
                  href="https://wa.me/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 text-slate-700 transition hover:text-green-700"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 text-green-700">
                    <MessageCircle size={20} />
                  </span>

                  <span>
                    <span className="block text-sm text-slate-500">
                      WhatsApp
                    </span>
                    <span className="font-medium">Chat with us</span>
                  </span>
                </a>
              </div>
            </aside>

            <div>
              <h2 className="text-2xl font-bold text-[#07152F]">
                Send us a request
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Complete the form below and we'll review your request.
              </p>

              {error && (
                <div
                  role="alert"
                  className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8 space-y-8">
                <div>
                  <h3 className="mb-5 text-lg font-semibold text-[#07152F]">
                    Your details
                  </h3>

                  <ContactDetailsStep
                    contact={contact}
                    onChange={handleContactChange}
                  />
                </div>

                <div className="border-t border-slate-200 pt-8">
                  <h3 className="text-lg font-semibold text-[#07152F]">
                    Services required
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Select a category to view its available services.
                  </p>

                  {loadingServices ? (
                    <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                      <LoaderCircle size={17} className="animate-spin" />
                      Loading services...
                    </div>
                  ) : (
                    <div className="mt-5 space-y-5">
                      <div>
                        <label
                          htmlFor="service-category"
                          className="mb-2 block text-sm font-medium text-slate-700"
                        >
                          Service category
                        </label>

                        <select
                          id="service-category"
                          value={selectedCategoryId}
                          onChange={(event) => {
                            setSelectedCategoryId(event.target.value);
                            setServiceDropdownOpen(false);
                          }}
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">Select a category</option>

                          {categories.map((category) => (
                            <option
                              key={category._id}
                              value={category._id}
                            >
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedCategory && (
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Select services
                          </label>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setServiceDropdownOpen((open) => !open)
                              }
                              className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-3 text-left text-sm transition hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            >
                              <span
                                className={
                                  selectedCategoryServiceCount > 0
                                    ? "text-slate-800"
                                    : "text-slate-400"
                                }
                              >
                                {selectedCategoryServiceCount > 0
                                  ? `${selectedCategoryServiceCount} service${selectedCategoryServiceCount === 1 ? "" : "s"} selected`
                                  : "Choose one or more services"}
                              </span>

                              <ChevronDown
                                size={18}
                                className={`text-slate-500 transition ${
                                  serviceDropdownOpen ? "rotate-180" : ""
                                }`}
                              />
                            </button>

                            {serviceDropdownOpen && (
                              <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                                <div className="max-h-64 overflow-y-auto p-2">
                                  {selectedCategory.services.length === 0 ? (
                                    <p className="px-3 py-4 text-sm text-slate-500">
                                      No services are currently available in
                                      this category.
                                    </p>
                                  ) : (
                                    selectedCategory.services.map(
                                      (service) => {
                                        const checked = selectedIds.includes(
                                          service._id,
                                        );

                                        return (
                                          <label
                                            key={service._id}
                                            className="flex cursor-pointer items-start gap-3 rounded-md px-3 py-3 transition hover:bg-slate-50"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={checked}
                                              onChange={() =>
                                                toggleService(service)
                                              }
                                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />

                                            <span className="min-w-0">
                                              <span className="block text-sm font-medium text-slate-800">
                                                {service.name}
                                              </span>

                                              {service.shortDescription && (
                                                <span className="mt-1 block text-xs leading-5 text-slate-500">
                                                  {service.shortDescription}
                                                </span>
                                              )}
                                            </span>
                                          </label>
                                        );
                                      },
                                    )
                                  )}
                                </div>

                                <div className="flex justify-end border-t border-slate-100 px-3 py-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setServiceDropdownOpen(false)
                                    }
                                    className="rounded-md bg-[#07152F] px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-800"
                                  >
                                    Done
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedServices.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-slate-700">
                            Selected services ({selectedServices.length})
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {selectedServices.map((service) => (
                              <span
                                key={service._id}
                                className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 py-1.5 pl-3 pr-2 text-sm text-blue-800"
                              >
                                {service.name}

                                <button
                                  type="button"
                                  onClick={() => removeService(service._id)}
                                  aria-label={`Remove ${service.name}`}
                                  className="rounded-full p-0.5 transition hover:bg-blue-100"
                                >
                                  <X size={14} />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedServices.length > 0 && (
                  <div className="border-t border-slate-200 pt-8">
                    <h3 className="mb-2 text-lg font-semibold text-[#07152F]">
                      Project details
                    </h3>

                    <p className="mb-6 text-sm text-slate-500">
                      Provide the details requested for each selected service.
                    </p>

                    {loadingForms ? (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <LoaderCircle size={17} className="animate-spin" />
                        Loading service forms...
                      </div>
                    ) : (
                      <ServiceDetailsStep
                        services={selectedServices}
                        forms={forms}
                        answers={answers}
                        onChange={handleAnswersChange}
                      />
                    )}
                  </div>
                )}

                <div className="border-t border-slate-200 pt-6">
                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      loadingServices ||
                      loadingForms ||
                      selectedServices.length === 0
                    }
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1556D6] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {submitting ? (
                      <>
                        <LoaderCircle size={18} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit request
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ContactPage;