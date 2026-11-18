const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER?.replace(
  /\D/g,
  ""
);

const WHATSAPP_MESSAGE =
  "Hello PrimeAce, I would like to make an enquiry about your services.";

function FloatingWhatsApp() {
  if (!WHATSAPP_NUMBER) {
    return null;
  }

  const whatsappUrl = new URL(
    `https://wa.me/${WHATSAPP_NUMBER}`
  );

  whatsappUrl.searchParams.set("text", WHATSAPP_MESSAGE);

  return (
    <a
      href={whatsappUrl.toString()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with PrimeAce on WhatsApp"
      title="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-60 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:bg-[#20BD5A] hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#25D366] sm:bottom-8 sm:right-8 sm:h-16 sm:w-16"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        fill="currentColor"
        className="h-8 w-8 sm:h-9 sm:w-9"
        aria-hidden="true"
      >
        <path d="M16.01 3C8.84 3 3.01 8.82 3.01 15.99c0 2.3.61 4.54 1.77 6.51L3 29l6.67-1.75a12.98 12.98 0 0 0 6.34 1.65h.01C23.18 28.9 29 23.07 29 15.9A12.9 12.9 0 0 0 16.01 3Zm0 23.72h-.01a10.8 10.8 0 0 1-5.5-1.51l-.39-.23-3.96 1.04 1.06-3.86-.25-.4a10.73 10.73 0 0 1-1.65-5.77c0-5.91 4.81-10.72 10.71-10.72 2.86 0 5.55 1.11 7.57 3.14a10.65 10.65 0 0 1 3.13 7.58c0 5.91-4.81 10.73-10.71 10.73Zm5.88-8.03c-.32-.16-1.9-.94-2.2-1.05-.3-.11-.51-.16-.72.16-.21.32-.83 1.05-1.02 1.27-.19.21-.37.24-.69.08-.32-.16-1.36-.5-2.59-1.6-.96-.85-1.61-1.9-1.8-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.74-.99-2.38-.26-.62-.52-.54-.72-.55h-.62c-.21 0-.56.08-.86.4-.3.32-1.12 1.1-1.12 2.67 0 1.58 1.15 3.1 1.31 3.31.16.21 2.26 3.45 5.48 4.84.76.33 1.35.52 1.81.67.76.24 1.46.21 2.01.13.61-.09 1.9-.78 2.17-1.53.27-.75.27-1.39.19-1.53-.08-.13-.29-.21-.61-.37Z" />
      </svg>
    </a>
  );
}

export default FloatingWhatsApp;
