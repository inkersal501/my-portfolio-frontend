import Header from "../components/Header";
import About from "../components/About";
import Skills from "../components/Skills";
import Projects from "../components/Projects";
import Footer from "../components/Footer";
import Experience from "../components/Experience";
import Certifications from "../components/Certifications";
import Faq from "../components/Faq";
import Contact from "../components/Contact";
import Navbar from "../components/Navbar";
import FloatingSocials from "../components/FloatingSocials";
import BackToTop from "../components/BackToTop"; 

function Home() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <Navbar />
      <Header />
      <About />
      <Skills />
      <Experience />
      <Projects />
      <Certifications />      
      <Faq />
      <Contact />
      <Footer />
      <FloatingSocials />
      <BackToTop />
    </div>
  );
}
export default Home;