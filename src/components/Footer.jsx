import { useSelector } from "react-redux";
import { useEffect, useState } from "react";

const Footer = () => {
  const profileData = useSelector((state) => state.profile?.data || {});
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (profileData?.last_updated) {
      setLastUpdated(new Date(profileData.last_updated).toLocaleString("en-US"));
    }
  }, [profileData?.last_updated]);

  return (
    <footer className="text-center text-gray-400 py-4 bg-black">
      <div className="container mx-auto">
        {lastUpdated && <p className="mb-2 text-sm">Last Updated: {lastUpdated}</p>}
        <p className="text-sm">© {new Date().getFullYear()} {profileData?.name || "Your Name"}. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
