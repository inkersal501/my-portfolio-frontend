import { useState } from "react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const handleScroll = (id) => {
    const element = document.getElementById(id);
    const offset = 80; // Adjust based on navbar height
    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: elementPosition - offset, behavior: "smooth" });
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-900 shadow-lg z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <a  onClick={() => handleScroll('top')} className="text-white text-2xl font-bold hover:text-yellow-400 cursor-pointer">Inkersal</a>

        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-6 text-gray-300">
        <li><button onClick={() => handleScroll('about')} className="hover:text-yellow-400 cursor-pointer">About</button></li>
        <li><button onClick={() => handleScroll('projects')} className="hover:text-yellow-400 cursor-pointer">Projects</button></li>
        <li><button onClick={() => handleScroll('experience')} className="hover:text-yellow-400 cursor-pointer">Experience</button></li>
        <li><button onClick={() => handleScroll('certifications')} className="hover:text-yellow-400 cursor-pointer">Certifications</button></li>
        <li><button onClick={() => handleScroll('contact')} className="hover:text-yellow-400 cursor-pointer">Contact</button></li>
        </ul>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          ☰
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-gray-800 text-white text-center py-4">
          <a href="#about" className="block py-2 hover:text-yellow-300" onClick={() => setIsOpen(false)}>About</a>
          <a href="#projects" className="block py-2 hover:text-yellow-300" onClick={() => setIsOpen(false)}>Projects</a>
          <a href="#experience" className="block py-2 hover:text-yellow-300" onClick={() => setIsOpen(false)}>Experience</a>
          <a href="#certifications" className="block py-2 hover:text-yellow-300" onClick={() => setIsOpen(false)}>Certifications</a>
          <a href="#contact" className="block py-2 hover:text-yellow-300" onClick={() => setIsOpen(false)}>Contact</a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
