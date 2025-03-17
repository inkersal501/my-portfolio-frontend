import git from '../assets/github.svg';
import linkedin from '../assets/linkedin.svg';
import email from '../assets/email.svg';
import { useSelector } from 'react-redux';
 
const Contact = () =>{  

  const profileData = useSelector((state)=> state.profile.data);
  
  return(
    <section className="py-10 text-center">
      <h2 className="text-3xl font-semibold mb-6" id="contact">Contact Me</h2>
      <p className="text-gray-400 mb-4">
        Let&apos;s collaborate! Feel free to reach out via email or social platforms.
      </p>
      <div className="flex justify-center gap-4">
        <a 
            href={`mailto:${profileData.email}`}
            className="px-4 py-4 rounded-lg bg-white shadow-md hover:bg-yellow-300 transition">
            <img src={email} className="w-7" alt="Email" />
        </a>
        <a
            href={profileData.github}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-4 rounded-lg bg-white shadow-md hover:bg-yellow-300 transition"
        >
            <img src={git} className="w-7" alt="Github" />
        </a>
        <a
            href={profileData.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-4 rounded-lg bg-white shadow-md hover:bg-yellow-300 transition"
        >
            <img src={linkedin} className="w-7" alt="Linkedin" />
        </a>
      </div>
    </section>
  ); 
}
export default Contact;