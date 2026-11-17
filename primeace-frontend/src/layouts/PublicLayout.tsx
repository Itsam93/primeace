import { Outlet } from "react-router-dom";

import Navbar from "../layouts/Navbar";
import FloatingWhatsapp from "../features/home/components/FloatingWhatsApp";
import { navigationItems } from "../features/home/data/navigation";

function PublicLayout() {
  return (
    <>
      <Navbar
        brandName="Prime"
        brandAccent="Ace"
        navigationItems={navigationItems}
        ctaLabel="Start a Project"
        ctaHref="/request-service"
        homeHref="/"
      />

      <Outlet />

      <FloatingWhatsapp />
    </>
  );
}

export default PublicLayout;
