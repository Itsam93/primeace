import Header from "../components/Header";
import Hero from "../components/Hero";
import About from "../components/About";
import Services from "../components/Services";
import WhyChooseUs from "../components/WhyChooseUs";
import CallToAction from "../components/CallToAction";
import Reviews from "../components/Reviews";
import Footer from "../components/Footer";
import FloatingWhatsApp from "../components/FloatingWhatsApp";

function HomePage() {
  return (
    <>
      <Header />

      <main>
        <Hero />
        <About />
        <Services />
        <WhyChooseUs />
        <CallToAction />
        <Reviews />
      </main>

      <Footer />

      <FloatingWhatsApp />
    </>
  );
}

export default HomePage;

