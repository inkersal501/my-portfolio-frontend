import { useEffect, useState } from "react";
import { fetchSkills } from "../js/fetchData";
import { Fade, Zoom } from "react-awesome-reveal"; 

const Skills = () => {
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const data = await fetchSkills();
      setSkills(data);
    };
    fetch();
  }, []);

  return (
    <section className="py-16 px-4 sm:px-8 md:px-12 lg:px-20 xl:px-32 bg-gray-900 text-yellow-400">
      <div className="max-w-6xl mx-auto text-center">
        
        {/* Title */}
        <Fade direction="up" duration={800} triggerOnce>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold drop-shadow-md" id="skills">
            Skills & Technologies
          </h3>
        </Fade>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8">
          {skills.map((data, index) => (
            <Zoom key={index} duration={800} triggerOnce>
              <div className="h-full bg-gray-800 p-6 rounded-xl shadow-md border border-yellow-400 transform transition duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500">
                <h4 className="text-lg sm:text-xl font-semibold">{data.category}</h4>
                <p className="text-gray-400 mt-2 text-sm sm:text-base">{data.skills}</p>
              </div>
            </Zoom>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;
