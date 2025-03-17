import { useState, useEffect } from "react";
import { fetchExperience } from "../js/fetchData";

const Experience = () => {
    const [experienceData, setExperienceData] = useState([]);

    useEffect(()=>{ 
      const fetch = async () => {
        const data = await fetchExperience();
        setExperienceData(data);
      };
      fetch();
    }, []);

    return (
      <section className="py-10">
        <h2 className="text-3xl font-semibold text-center mb-6" id="experience">Experience</h2>
        <div className="space-y-8 border-l-4 border-yellow-500 pl-6">
          {experienceData.map((exp, index) => (
            <div key={index} className="relative">
              <div className="absolute -left-9.5 w-6 h-6 bg-yellow-500 rounded-full"></div>
              <h3 className="text-xl font-semibold">{exp.role} @ {exp.company}</h3>
              <p className="text-gray-400 italic">{exp.duration}</p>
              <ul className="mt-2 text-gray-300 list-disc list-inside">
                {exp.contributions.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    );
  };
  
  

export default Experience;