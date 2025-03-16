import { useSelector } from "react-redux";

const Footer = () => {
  const profileData = useSelector((state)=> state.profile.data);
  
  return (
    <footer className="text-center text-gray-400 py-6">
      <p>Last Updated {profileData.lastUpdated} </p>
      <p>© {new Date().getFullYear()} {profileData.name}. All rights reserved.</p>
    </footer>
  );
}
export default Footer;