import { useEffect } from "react";
import { Fade, Zoom } from "react-awesome-reveal";
import { fetchProfile } from "../js/fetchData";
import { useDispatch, useSelector } from "react-redux";
import { setProfile } from "../redux/profileSlice"; 

const Header = () => {
  const profileData = useSelector((state) => state.profile.data);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetch = async () => {
      const data = await fetchProfile();
      dispatch(setProfile(data));
    };
    fetch();
    //eslint-disable-next-line
  }, []);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center bg-black text-yellow-400 px-4 sm:px-8 md:px-12 lg:px-20 xl:px-32">
      
      {/* Name */}
      <Fade direction="up" duration={800} triggerOnce>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-wide drop-shadow-md">
          {profileData.name}
        </h1>
      </Fade>

      {/* Tagline */}
      <Fade direction="up" duration={800} triggerOnce delay={400}>
        <h2 className="text-lg sm:text-xl md:text-2xl text-gray-300 mt-3 sm:mt-4 font-light italic">
          {profileData.tagline}
        </h2>
      </Fade>

      {/* Description */}
      <Zoom duration={800} triggerOnce delay={800}>
        <p className="text-sm sm:text-base md:text-lg text-gray-400 mt-3 sm:mt-4 max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl">
          {profileData.description}
        </p>
      </Zoom>
      
    </section>
  );
};

export default Header;
