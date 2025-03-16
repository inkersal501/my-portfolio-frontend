import { useEffect } from "react";
import { Fade } from "react-awesome-reveal";
import { fetchProfile } from "../js/fetchData";
import { useDispatch, useSelector } from "react-redux";
import { setProfile } from "../redux/profileSlice";
  

const Header = () => {
  const profileData = useSelector((state)=> state.profile.data);
  const dispatch = useDispatch();

  useEffect(()=>{
      const fetch = async () => {
        const data = await fetchProfile(); 
        dispatch(setProfile(data));
      }
      fetch(); 
  //eslint-disable-next-line     
  }, []); 


  return(
    <header className="text-center py-15 p-6" id="top">
      <div className="max-w-4xl mx-auto">
        <Fade direction="up" triggerOnce>
          <div className="flex justify-center">
            {/* <img src={logo} className="w-48" alt="logo" /> */}
          </div>
        </Fade>
        <h1 className="text-5xl font-extrabold text-yellow-300">{profileData.name}</h1>
        <h2 className="text-2xl text-white-800 mt-2">
        {profileData.tagline} <br/> {profileData.bio}
        </h2>
        <p className="text-white-800 mt-4 max-w-3xl mx-auto">
        {profileData.description}
        </p>
      </div>
    </header>
  );
}
export default Header;