import { useEffect, useState } from "react";
import { fetchAbout } from "../js/fetchData";
import { Fade, Zoom } from "react-awesome-reveal"; 

const About = () => {
  const [aboutContent, setAboutContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const data = await fetchAbout();
      setAboutContent(data);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-8 md:px-12 lg:px-20 xl:px-32 bg-gray-900 text-yellow-400">
      <div className="max-w-5xl mx-auto text-center">
        
        {/* Title */}
        <Fade direction="up" duration={800} triggerOnce>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold drop-shadow-md" id="about">
            About Me
          </h2>
        </Fade>

        {/* Content */}
        <Zoom duration={800} triggerOnce>
          {loading ? (
            <p className="text-gray-500 mt-4 sm:mt-6 text-base sm:text-lg">
              Loading...
            </p>
          ) : (
            aboutContent.map((data, index) => (
              <p 
                key={index} 
                className="text-gray-300 mt-4 sm:mt-6 text-base sm:text-lg md:text-xl leading-relaxed"
              >
                {data.description}
              </p>
            ))
          )}
        </Zoom>
      </div>
    </section>
  );
};

export default About;
