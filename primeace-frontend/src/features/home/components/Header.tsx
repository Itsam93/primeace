import Navbar from "../../../layouts/Navbar";
import { navigationItems } from "../data/navigation";

function Header() {
  return (
    <Navbar
      brandName="Prime"
      brandAccent="Ace"
      navigationItems={navigationItems}
      ctaLabel="Start a Project"
      ctaHref="#contact"
      homeHref="#home"
    />
  );
}

export default Header;
