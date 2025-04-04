import git from "../assets/github.svg";
import linkedin from "../assets/linkedin.svg";
import email from "../assets/email.svg";
import { useSelector } from "react-redux";
import { Slide } from "react-awesome-reveal";
const Contact = () => {
  const profileData = useSelector((state) => state.profile.data) || {};

  const contactItems = [
    { id: "email", href: `mailto:${profileData.email}`, icon: email, alt: "Email icon", label: "Send me an email" },
    { id: "github", href: profileData.github, icon: git, alt: "GitHub icon", label: "Visit my GitHub profile" },
    { id: "linkedin", href: profileData.linkedin, icon: linkedin, alt: "LinkedIn icon", label: "Connect on LinkedIn" },
  ];

  return (
    <section className="py-16 px-6 bg-gray-900 text-yellow-400 text-center">
      {/* Section Title */}
      <h2 className="text-4xl font-bold mb-6 drop-shadow-md" id="contact">
        Contact Me
      </h2>
      <p className="text-gray-400 mb-8 max-w-lg mx-auto">
        Let&apos;s collaborate! Feel free to reach out via email or social platforms.
      </p>

      {/* Contact Links */}
      <Slide direction="up" triggerOnce>
      <div className="flex justify-center gap-6">
        {contactItems.map(({ id, href, icon, alt, label }) =>
          href ? (
            
            <a
              key={id}
              href={href}
              target={id !== "email" ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="p-4 rounded-full bg-white shadow-lg hover:bg-yellow-300 transition-transform transform hover:scale-110 hover:shadow-yellow-500"
              aria-label={label}
            >
              <img src={icon} className="w-8 h-8" alt={alt} />
            </a>
            
          ) : null
        )}
      </div>
      </Slide>
    </section>
  );
};

export default Contact;
