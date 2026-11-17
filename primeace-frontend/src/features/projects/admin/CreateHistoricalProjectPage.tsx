import {
  useEffect,
  useRef,
  useState
} from "react";

import type { ChangeEvent, FormEvent } from "react";

import {
  Link,
  useNavigate
} from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  X
} from "lucide-react";

import { ProjectStatus } from "@primeace/shared";

import { ApiError } from "../../../lib/api.js";

import {
  createClient,
  getClients
} from "../../clients/services/client.service.js";

import type { IClient } from "../../clients/types/client.types.js";

import {
  createHistoricalProject
} from "../services/project.service.js";

const CLIENT_PAGE_SIZE = 10;

const statusLabels: Record<ProjectStatus, string> = {
  [ProjectStatus.NOT_STARTED]: "Not started",
  [ProjectStatus.IN_PROGRESS]: "In progress",
  [ProjectStatus.UNDER_REVIEW]: "Under review",
  [ProjectStatus.ON_HOLD]: "On hold",
  [ProjectStatus.COMPLETED]: "Completed",
  [ProjectStatus.CANCELLED]: "Cancelled"
};

function toDateTime(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

export default function CreateHistoricalProjectPage() {
  const navigate = useNavigate();

  const searchRequestId = useRef(0);

  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<IClient | null>(null);
  const [clients, setClients] = useState<IClient[]>([]);
  const [clientLoading, setClientLoading] = useState(false);
  const [clientError, setClientError] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);

  const [showCreateClientForm, setShowCreateClientForm] = useState(false);
  const [newClientFullName, setNewClientFullName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientOrganisation, setNewClientOrganisation] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);
  const [createClientError, setCreateClientError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [serviceNames, setServiceNames] = useState<string[]>([""]);
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expectedCompletionDate, setExpectedCompletionDate] = useState("");
  const [completedAt, setCompletedAt] = useState("");
  const [status, setStatus] = useState<ProjectStatus>(
    ProjectStatus.COMPLETED
  );

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (selectedClient || showCreateClientForm) {
      return;
    }

    const requestId = ++searchRequestId.current;

    const timeout = window.setTimeout(async () => {
      try {
        setClientLoading(true);
        setClientError("");

        const result = await getClients({
          page: 1,
          limit: CLIENT_PAGE_SIZE,
          ...(clientSearch.trim()
            ? { search: clientSearch.trim() }
            : {})
        });

        if (requestId === searchRequestId.current) {
          setClients(result.clients);
        }
      } catch (err) {
        if (requestId === searchRequestId.current) {
          setClientError(
            err instanceof ApiError
              ? err.message
              : "Unable to load clients. Please try again."
          );
        }
      } finally {
        if (requestId === searchRequestId.current) {
          setClientLoading(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [clientSearch, selectedClient, showCreateClientForm]);

  const handleClientSearch = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setSelectedClient(null);
    setShowCreateClientForm(false);
    setClientSearch(event.target.value);
    setClientDropdownOpen(true);
  };

  const handleClientSelect = (client: IClient) => {
    setSelectedClient(client);
    setClientSearch(client.fullName);
    setClientDropdownOpen(false);
    setClients([]);
    setClientError("");
    setShowCreateClientForm(false);
  };

  const handleOpenCreateClient = () => {
    setShowCreateClientForm(true);
    setClientDropdownOpen(false);
    setCreateClientError("");
    setClientError("");
  };

  const handleCancelCreateClient = () => {
    setShowCreateClientForm(false);
    setCreateClientError("");
  };

  const handleCreateClient = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setCreateClientError("");

    if (newClientFullName.trim().length < 2) {
      setCreateClientError("Enter a valid client name.");
      return;
    }

    if (newClientPhone.trim().length < 7) {
      setCreateClientError("Enter a valid phone number.");
      return;
    }

    try {
      setCreatingClient(true);

      const client = await createClient({
        fullName: newClientFullName.trim(),
        phone: newClientPhone.trim(),
        ...(newClientEmail.trim()
          ? { email: newClientEmail.trim() }
          : {}),
        ...(newClientOrganisation.trim()
          ? { organisation: newClientOrganisation.trim() }
          : {})
      });

      handleClientSelect(client);

      setClientSearch(client.fullName);
      setNewClientFullName("");
      setNewClientPhone("");
      setNewClientEmail("");
      setNewClientOrganisation("");
      setShowCreateClientForm(false);
    } catch (err) {
      setCreateClientError(
        err instanceof ApiError
          ? err.message
          : "Unable to create the client. Please try again."
      );
    } finally {
      setCreatingClient(false);
    }
  };

  const handleServiceChange = (
    index: number,
    value: string
  ) => {
    setServiceNames((current) =>
      current.map((service, currentIndex) =>
        currentIndex === index ? value : service
      )
    );
  };

  const handleAddService = () => {
    setServiceNames((current) => [...current, ""]);
  };

  const handleRemoveService = (index: number) => {
    setServiceNames((current) =>
      current.filter((_, currentIndex) => currentIndex !== index)
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setFormError("");

    if (!selectedClient) {
      setFormError("Please select or create a client.");
      return;
    }

    const cleanedServices = serviceNames
      .map((service) => service.trim())
      .filter(Boolean);

    if (cleanedServices.length === 0) {
      setFormError("Add at least one service handled for this project.");
      return;
    }

    if (!completedAt) {
      setFormError("Enter the project's completion date.");
      return;
    }

    if (startDate && startDate > completedAt) {
      setFormError("The start date cannot be after the completion date.");
      return;
    }

    if (
      startDate &&
      expectedCompletionDate &&
      expectedCompletionDate < startDate
    ) {
      setFormError(
        "The expected completion date cannot be before the start date."
      );
      return;
    }

    if (
      expectedCompletionDate &&
      completedAt &&
      expectedCompletionDate < completedAt &&
      status !== ProjectStatus.COMPLETED
    ) {
      setFormError(
        "The expected completion date cannot be before the completion date."
      );
      return;
    }

    let contractAmountKobo: number | null = null;

    if (amount.trim()) {
      const numericAmount = Number(amount);

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount < 0 ||
        !Number.isSafeInteger(Math.round(numericAmount * 100))
      ) {
        setFormError("Enter a valid project amount.");
        return;
      }

      contractAmountKobo = Math.round(numericAmount * 100);
    }

    try {
      setSubmitting(true);

      const project = await createHistoricalProject({
        clientId: selectedClient._id,
        title: title.trim(),
        description: description.trim(),
        serviceNames: cleanedServices,
        contractAmountKobo,
        startDate: startDate ? toDateTime(startDate) : null,
        expectedCompletionDate: expectedCompletionDate
          ? toDateTime(expectedCompletionDate)
          : null,
        completedAt: toDateTime(completedAt),
        status
      });

      navigate(`/admin/projects/${project.id}`);
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : "Unable to create the historical project. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          to="/admin/projects"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to projects
        </Link>

        <h1 className="text-2xl font-semibold text-gray-900">
          Add historical project
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Record work completed before PrimeAce started using this project management system.
        </p>
      </div>

      {formError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{formError}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Client */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="font-semibold text-gray-900">
              Client information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Select an existing client or create a new client for this project.
            </p>
          </div>

          {!selectedClient && !showCreateClientForm && (
            <>
              <div className="relative">
                <label
                  htmlFor="clientSearch"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Client <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="clientSearch"
                    type="search"
                    value={clientSearch}
                    onChange={handleClientSearch}
                    onFocus={() => setClientDropdownOpen(true)}
                    placeholder="Search client by name, email or phone..."
                    autoComplete="off"
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {clientDropdownOpen && (
                  <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {clientLoading ? (
                      <div className="flex items-center justify-center gap-2 px-4 py-5 text-sm text-gray-500">
                        <RefreshCw size={16} className="animate-spin" />
                        Searching clients...
                      </div>
                    ) : clientError ? (
                      <p className="px-4 py-4 text-sm text-red-600">
                        {clientError}
                      </p>
                    ) : clients.length === 0 ? (
                      <p className="px-4 py-4 text-sm text-gray-500">
                        No clients found.
                      </p>
                    ) : (
                      clients.map((client) => (
                        <button
                          key={client._id}
                          type="button"
                          onClick={() => handleClientSelect(client)}
                          className="block w-full border-b border-gray-100 px-4 py-3 text-left transition last:border-0 hover:bg-gray-50"
                        >
                          <p className="text-sm font-medium text-gray-900">
                            {client.fullName}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {client.email || "No email"} · {client.phone}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Can't find the client?
                </p>

                <button
                  type="button"
                  onClick={handleOpenCreateClient}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800"
                >
                  <UserPlus size={16} />
                  Create new client
                </button>
              </div>
            </>
          )}

          {showCreateClientForm && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-5">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    New client
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Enter the client's contact information.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCancelCreateClient}
                  disabled={creatingClient}
                  aria-label="Close new client form"
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700 disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              {createClientError && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <p>{createClientError}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="newClientFullName"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Full name <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="newClientFullName"
                    type="text"
                    value={newClientFullName}
                    onChange={(event) =>
                      setNewClientFullName(event.target.value)
                    }
                    placeholder="Enter client's full name"
                    minLength={2}
                    maxLength={100}
                    required
                    disabled={creatingClient}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="newClientPhone"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Phone number <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="newClientPhone"
                    type="tel"
                    value={newClientPhone}
                    onChange={(event) =>
                      setNewClientPhone(event.target.value)
                    }
                    placeholder="Enter phone number"
                    minLength={7}
                    maxLength={20}
                    required
                    disabled={creatingClient}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="newClientEmail"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Email address
                  </label>

                  <input
                    id="newClientEmail"
                    type="email"
                    value={newClientEmail}
                    onChange={(event) =>
                      setNewClientEmail(event.target.value)
                    }
                    placeholder="Enter email address"
                    maxLength={254}
                    disabled={creatingClient}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="newClientOrganisation"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Organisation
                  </label>

                  <input
                    id="newClientOrganisation"
                    type="text"
                    value={newClientOrganisation}
                    onChange={(event) =>
                      setNewClientOrganisation(event.target.value)
                    }
                    placeholder="Enter organisation"
                    maxLength={150}
                    disabled={creatingClient}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCancelCreateClient}
                  disabled={creatingClient}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const form = document.getElementById(
                      "newClientFullName"
                    ) as HTMLInputElement | null;

                    if (form?.form) {
                      form.form.requestSubmit();
                    }
                  }}
                  disabled={creatingClient}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingClient && (
                    <RefreshCw size={16} className="animate-spin" />
                  )}

                  {creatingClient ? "Creating client..." : "Create and select client"}
                </button>
              </div>

              {/* This form is deliberately separate from the project form. */}
              <form
                id="newClientForm"
                onSubmit={handleCreateClient}
                className="hidden"
              />
            </div>
          )}

          {selectedClient && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedClient.fullName}
                    </p>

                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      Selected
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-600">
                    {selectedClient.email || "No email"}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    {selectedClient.phone}
                  </p>

                  {selectedClient.organisation && (
                    <p className="mt-1 text-sm text-gray-600">
                      {selectedClient.organisation}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedClient(null);
                    setClientSearch("");
                    setClientDropdownOpen(true);
                  }}
                  className="text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          <p className="mt-3 text-xs text-gray-500">
            The project will be linked to the selected client's record.
          </p>
        </section>

        {/* Project details */}
        <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="font-semibold text-gray-900">
              Project details
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Provide the main information about the work handled.
            </p>
          </div>

          <div>
            <label
              htmlFor="projectTitle"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Project title <span className="text-red-500">*</span>
            </label>

            <input
              id="projectTitle"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter the project title"
              minLength={2}
              maxLength={200}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="projectDescription"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Project description <span className="text-red-500">*</span>
            </label>

            <textarea
              id="projectDescription"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the work completed and its scope..."
              rows={5}
              minLength={2}
              maxLength={5000}
              required
              className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-1 text-right text-xs text-gray-400">
              {description.length}/5000
            </p>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Services handled <span className="text-red-500">*</span>
                </label>

                <p className="mt-1 text-xs text-gray-500">
                  Add each service delivered for this project.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddService}
                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800"
              >
                <Plus size={16} />
                Add service
              </button>
            </div>

            <div className="space-y-3">
              {serviceNames.map((service, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={service}
                    onChange={(event) =>
                      handleServiceChange(index, event.target.value)
                    }
                    placeholder={`Service ${index + 1}`}
                    maxLength={150}
                    required={index === 0}
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  {serviceNames.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveService(index)}
                      aria-label={`Remove service ${index + 1}`}
                      className="rounded-lg p-2.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Financial and timeline information */}
        <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="font-semibold text-gray-900">
              Amount and timeline
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Record the financial and date information available for this project.
            </p>
          </div>

          <div>
            <label
              htmlFor="projectAmount"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Project amount (₦)
            </label>

            <input
              id="projectAmount"
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="e.g. 150000"
              min="0"
              step="0.01"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-1 text-xs text-gray-500">
              Optional. Leave blank if the project amount is unavailable.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="startDate"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Start date
              </label>

              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                max={completedAt || undefined}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="expectedCompletionDate"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Expected completion date
              </label>

              <input
                id="expectedCompletionDate"
                type="date"
                value={expectedCompletionDate}
                onChange={(event) =>
                  setExpectedCompletionDate(event.target.value)
                }
                min={startDate || undefined}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="completedAt"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Actual completion date <span className="text-red-500">*</span>
              </label>

              <input
                id="completedAt"
                type="date"
                value={completedAt}
                onChange={(event) => setCompletedAt(event.target.value)}
                min={startDate || undefined}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="projectStatus"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Project status
              </label>

              <select
                id="projectStatus"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ProjectStatus)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {Object.values(ProjectStatus).map((value) => (
                  <option key={value} value={value}>
                    {statusLabels[value]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Form actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/admin/projects"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting || creatingClient || showCreateClientForm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && (
              <RefreshCw size={16} className="animate-spin" />
            )}

            {submitting ? "Creating project..." : "Create historical project"}
          </button>
        </div>
      </form>
    </div>
  );
}
