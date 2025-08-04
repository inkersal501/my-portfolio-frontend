import { useSelector } from "react-redux";
import { useEffect, useState } from "react";

const Footer = () => {
  const profileData = useSelector((state) => state.profile?.data || {});
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (profileData?.last_updated) {
      const date = new Date(profileData?.last_updated);
      const formattedDateTime = `${date.getDate().toString().padStart(2, "0")}-` +
      `${date.toLocaleString("en-IN", { month: "short" })}-` +
      `${date.getFullYear()} ` +
      `${date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
      }).toLowerCase()}`;
      setLastUpdated(formattedDateTime);
    }
  }, [profileData?.last_updated]);
      
  return (
    <footer className="text-center text-gray-400 py-4 bg-black">
      <div className="container mx-auto">
        {lastUpdated && <p className="mb-2 text-sm">Last Updated: {lastUpdated}</p>}
        <p className="text-sm">© {new Date().getFullYear()} {profileData?.name || ""}. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
