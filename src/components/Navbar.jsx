import { useState } from "react";
import { Slide } from "react-awesome-reveal";
import { useSelector } from "react-redux";

const Navbar = () => {

  const profileData = useSelector((state) => state.profile?.data || {});
  const [isOpen, setIsOpen] = useState(false);
  const handleScroll = (id) => {
    const element = document.getElementById(id);
    const offset = 80; // Adjust based on navbar height
    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: elementPosition - offset, behavior: "smooth" });
  };

  return (
    
    <nav className="fixed top-0 left-0 w-full bg-gray-900 shadow-lg z-50">
      <Slide direction="down" triggerOnce>
      <div className="mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <a href="https://inkersal-mahendran.vercel.app/" className="text-white text-2xl font-bold hover:text-yellow-400 cursor-pointer">Inkersal</a>
        <a href={profileData.resume} target="_blank"
        className="inline-block px-5 py-2 rounded-xl bg-yellow-400 text-gray-900 shadow-lg transition transform hover:scale-110"
        >Resume</a>
        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-6 text-gray-300">
        <li><button onClick={() => handleScroll('about')} className="hover:text-yellow-400 cursor-pointer">About</button></li>        
        <li><button onClick={() => handleScroll('skills')} className="hover:text-yellow-400 cursor-pointer">Skills</button></li>
        <li><button onClick={() => handleScroll('experience')} className="hover:text-yellow-400 cursor-pointer">Experience</button></li>
        <li><button onClick={() => handleScroll('projects')} className="hover:text-yellow-400 cursor-pointer">Projects</button></li>        
        <li><button onClick={() => handleScroll('certifications')} className="hover:text-yellow-400 cursor-pointer">Certifications</button></li>
        <li><button onClick={() => handleScroll('contact')} className="hover:text-yellow-400 cursor-pointer">Contact</button></li>
        </ul>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          ☰
        </button>
      </div>
      </Slide>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-gray-800 text-white text-center py-4 px-4">
          <button className="block py-2 hover:text-yellow-300" onClick={() => { handleScroll('about'); setIsOpen(false); }}>About</button>
          <button className="block py-2 hover:text-yellow-300" onClick={() => { handleScroll('skills'); setIsOpen(false); }}>Skills</button>
          <button className="block py-2 hover:text-yellow-300" onClick={() => { handleScroll('projects'); setIsOpen(false); }}>Projects</button>
          <button className="block py-2 hover:text-yellow-300" onClick={() => { handleScroll('experience'); setIsOpen(false); }}>Experience</button>
          <button className="block py-2 hover:text-yellow-300" onClick={() => { handleScroll('certifications'); setIsOpen(false); }}>Certifications</button>
          <button className="block py-2 hover:text-yellow-300" onClick={() => { handleScroll('contact'); setIsOpen(false); }}>Contact</button>
        </div>
      )}
    </nav> 
  );
};

export default Navbar;
