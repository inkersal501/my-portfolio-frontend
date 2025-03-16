import { useEffect, useState } from "react";
import { fetchAbout } from "../js/fetchData";

const About = () => {

  const [aboutContent, setAboutContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
      const fetch = async () => {
        const data = await fetchAbout();
        setAboutContent(data);
        setLoading(false);
      }
      fetch();      
  }, []); 


  return (
    <section className="py-15 max-w-4xl mx-auto">
      <h2 className="text-3xl font-semibold text-white" id="about">About Me</h2>
      {loading ? 
      <p className="text-gray-300 mt-4">Loading...</p>
      :    
      aboutContent.map((data, index)=>(
        <p key={index} className="text-gray-300 mt-4">
        {data.description}
      </p>
      ))}     
      
    </section>
  );
}

export default About;