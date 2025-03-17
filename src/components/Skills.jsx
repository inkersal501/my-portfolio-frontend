import { useEffect, useState } from "react";
import { fetchSkills } from "../js/fetchData";


const Skills = ()=> {
  const [skills, setSkills] = useState([]);

  useEffect(()=>{
    const fetch = async ()=>{
      const data = await fetchSkills();
      setSkills(data); 
    };
    fetch();
  },[]);
  return (
    <section className="py-10 p-6">
        <h3 className="text-2xl font-semibold text-white mt-6">Skills & Technologies</h3>
        <ul className="text-gray-300 mt-2 list-disc list-inside">
        {skills.map((data, index)=> (
          <li key={index}>{data.category} : {data.skills}</li>
        ))} 
        </ul> 
    </section>
  )
}

export default Skills;