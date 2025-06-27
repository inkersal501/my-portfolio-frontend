import { FaGithub, FaLinkedin, FaHackerrank, FaCode, FaLaptopCode } from "react-icons/fa";
import { useSelector } from "react-redux";

const FloatingSocials = () => {

  const profileData = useSelector((state) => state.profile?.data || {});

  const socialLinks = [
    { id: "github", icon: <FaGithub size="20" />, link: profileData.github, name: "GitHub" },
    { id: "linkedin", icon: <FaLinkedin size="20" />, link: profileData.linkedin, name: "LinkedIn" }, 
    { id: "leetcode", icon: <FaCode size="20" />, link: profileData.leetcode, name: "LeetCode" },
    { id: "hackerrank", icon: <FaHackerrank size="20" />, link: profileData.hackerrank, name: "HackerRank" },
    { id: "crio", icon: <FaLaptopCode size="20" />, link: profileData.crio, name: "Crio.do" },
  ];

  return (
    <div className="fixed top-1/3 right-8 flex flex-col space-y-3 z-50">
      {socialLinks.map((social) => (
        <a
          key={social.id}
          href={social.link}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center space-x-2 relative"
        > 
          <span className="absolute right-12 opacity-0 group-hover:opacity-100 group-hover:-translate-x-2 bg-gray-800 text-white px-2 py-1 rounded-lg text-sm transition-all duration-300">
            {social.name}
          </span>
 
          <div className="p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-yellow-400 hover:text-gray-900 transition duration-300 transform hover:scale-110">
            {social.icon}
          </div>
        </a>
      ))}
    </div>
  );
};

export default FloatingSocials;
