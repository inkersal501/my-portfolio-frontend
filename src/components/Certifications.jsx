import { useEffect, useState } from "react";
import { fetchCertifications } from "../js/fetchData";

const Certifications = () => {

   const [certifications, setCertifications] = useState([]);
  
    useEffect(()=>{
      const fetch = async ()=>{
        const data = await fetchCertifications();
        setCertifications(data); 
      };
      fetch();
    },[]);

    return (
      <section className="py-10 p-6">
        <h2 className="text-3xl font-semibold text-center mb-6" id="certifications">Certifications & Achievements</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certifications.map((cert, index) => (
            <div key={index} className="bg-gray-800 p-5 rounded-lg shadow-md text-center">
              <a href={cert.url} target="_blank" rel="noreferrer">
                
                <p className="text-gray-200 font-semibold">{cert.name}</p>
              </a>
            </div>
          ))}
        </div>
      </section>
    );
  };
  export default Certifications;