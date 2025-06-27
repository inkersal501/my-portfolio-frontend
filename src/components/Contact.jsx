import { useSelector } from "react-redux";
import { Slide } from "react-awesome-reveal";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { MdOutlineMail } from "react-icons/md";

const Contact = () => {
  const profileData = useSelector((state) => state.profile.data) || {};

  const contactItems = [
    { id: "email", href: `mailto:${profileData.email}`, icon: <MdOutlineMail size={24}/>, label: "Send me an email" },
    { id: "github", href: profileData.github, icon: <FaGithub size={24}/>, label: "Visit my GitHub profile" },
    { id: "linkedin", href: profileData.linkedin, icon: <FaLinkedin size={24}/>, label: "Connect on LinkedIn" },
  ];

  return (
    <section className="py-16 px-6 bg-gray-900 text-center">
      {/* Section Title */}
      <h2 className="text-4xl font-bold mb-6 drop-shadow-md text-yellow-400 " id="contact">
        Contact Me
      </h2>
      <p className="text-gray-400 mb-8 max-w-lg mx-auto">
        Let&apos;s collaborate! Feel free to reach out via email or social platforms.
      </p>

      {/* Contact Links */}
      <Slide direction="up" triggerOnce>
      <div className="flex justify-center gap-6">
        {contactItems.map(({ id, href, icon, label }) =>
          href ? (
            
            <a
              key={id}
              href={href}
              target={id !== "email" ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="text-black p-4 rounded-full bg-white shadow-lg hover:bg-yellow-300 transition-transform transform hover:scale-110 hover:shadow-yellow-500"
              aria-label={label}
            >
              {icon}
            </a>
            
          ) : null
        )}
      </div>
      </Slide>
    </section>
  );
};

export default Contact;
