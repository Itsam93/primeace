import type { IServiceRequestContact } from "../../services/types/service.type.js";

interface ContactDetailsStepProps {
  contact: IServiceRequestContact;
  onChange: (contact: IServiceRequestContact) => void;
}

function ContactDetailsStep({
  contact,
  onChange
}: ContactDetailsStepProps) {
  function updateField(
    field: keyof IServiceRequestContact,
    value: string
  ) {
    onChange({
      ...contact,
      [field]: value
    });
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#07152F] outline-none transition focus:border-[#1556D6] focus:ring-2 focus:ring-blue-100";

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <label className="text-sm font-medium text-[#07152F]">
        Full name *
        <input
          required
          minLength={2}
          maxLength={100}
          value={contact.fullName}
          onChange={(event) => updateField("fullName", event.target.value)}
          placeholder="Enter your full name"
          className={inputClass}
        />
      </label>

      <label className="text-sm font-medium text-[#07152F]">
        Phone number *
        <input
          required
          minLength={7}
          maxLength={20}
          type="tel"
          value={contact.phone}
          onChange={(event) => updateField("phone", event.target.value)}
          placeholder="Enter your phone number"
          className={inputClass}
        />
      </label>

      <label className="text-sm font-medium text-[#07152F]">
        Email address
        <input
          type="email"
          maxLength={254}
          value={contact.email ?? ""}
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="Enter your email address"
          className={inputClass}
        />
      </label>

      <label className="text-sm font-medium text-[#07152F]">
        Organisation
        <input
          maxLength={150}
          value={contact.organisation ?? ""}
          onChange={(event) =>
            updateField("organisation", event.target.value)
          }
          placeholder="Company or organisation (optional)"
          className={inputClass}
        />
      </label>
    </div>
  );
}

export default ContactDetailsStep;