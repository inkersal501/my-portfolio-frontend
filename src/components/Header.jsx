// import logo from "../assets/logo.png"; 
import { Fade } from "react-awesome-reveal";

const Header = () => (
  <header className="text-center py-15 p-6" id="top">
    <div className="max-w-4xl mx-auto">
      <Fade direction="up" triggerOnce>
        <div className="flex justify-center">
          {/* <img src={logo} className="w-48" alt="logo" /> */}
        </div>
      </Fade>
      <h1 className="text-5xl font-extrabold text-yellow-300">Inkersal Mahendran</h1>
      <h2 className="text-2xl text-white-800 mt-2">
        Full-Stack Developer <br/> React ⚡ | Node.js 🚀 | PHP 🖥️ | MySQL 💾 | AWS ☁️
      </h2>
      <p className="text-white-800 mt-4 max-w-3xl mx-auto">
        Passionate about crafting scalable and high-performance web applications
        with modern technologies. Let&apos;s build something amazing together.
      </p>
    </div>
  </header>
);
export default Header;