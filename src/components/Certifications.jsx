import { useEffect, useState } from "react";
import { fetchCertifications } from "../js/fetchData";
import { Fade, Zoom } from "react-awesome-reveal";

const Certifications = () => {
  const [certifications, setCertifications] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const data = await fetchCertifications();
      setCertifications(data);
    };
    fetch();
  }, []);

  return (
    <section className="py-20 px-4 sm:px-8 md:px-12 lg:px-20 xl:px-32 bg-gray-900 text-yellow-400">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Title */}
        <Fade direction="up" duration={800} triggerOnce>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center drop-shadow-md mb-10" id="certifications">
            Certifications & Achievements
          </h2>
        </Fade>

        {/* Certifications Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {certifications.map((cert, index) => (
            <Zoom key={index} duration={800} triggerOnce>
              <a 
                href={cert.url} 
                target="_blank" 
                rel="noreferrer"
                className="h-full block bg-gray-800 p-6 rounded-lg shadow-md border border-yellow-500 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-yellow-500 hover:border-yellow-300"
              >
                <p className="text-lg font-semibold text-gray-200 text-center">{cert.name}</p>
              </a>
            </Zoom>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Certifications;
