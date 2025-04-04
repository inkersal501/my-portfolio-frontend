import { useState, useEffect } from "react";
import { fetchExperience } from "../js/fetchData";
import { Fade, Slide, Zoom } from "react-awesome-reveal";

const Experience = () => {
  const [experienceData, setExperienceData] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const data = await fetchExperience();
      setExperienceData(data);
    };
    fetch();
  }, []);

  return (
    <section className="py-20 px-4 sm:px-8 md:px-12 lg:px-20 xl:px-32 bg-gray-900 text-yellow-400">
      <div className="max-w-6xl mx-auto">
        
        {/* Title */}
        <Fade direction="up" duration={800} triggerOnce>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center drop-shadow-md mb-10" id="experience">
            Experience
          </h2>
        </Fade>

        {/* Timeline Container */}
        <div className="relative border-l-4 border-yellow-500 pl-6 sm:pl-10">
          {experienceData.map((exp, index) => (
            <Slide key={index} direction="up" triggerOnce>
              <div className="relative mb-12">
                
                {/* Timeline Dot */}
                <div className="absolute -left-9 sm:-left-13.5 w-5 h-5 sm:w-6 sm:h-6 bg-yellow-500 rounded-full border-4 border-gray-900"></div>

                {/* Experience Card */}
                <div className="bg-gray-800 p-5 sm:p-6 rounded-lg shadow-md border border-yellow-400 hover:shadow-yellow-500 transition duration-300">
                  <h3 className="text-xl sm:text-2xl font-semibold">{exp.role} @ {exp.company}</h3>
                  <p className="text-gray-400 italic text-sm sm:text-base">{exp.duration}</p>

                  <Zoom duration={800} triggerOnce>
                    <ul className="mt-4 text-gray-300 list-disc list-inside space-y-2">
                      {exp.contributions.map((con, i) => (
                        <li key={i}>{con.contribution}</li>
                      ))}
                    </ul>
                  </Zoom>
                </div>
              </div>
            </Slide>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;
