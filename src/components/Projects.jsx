import { useEffect, useState } from "react";
import { fetchProjects } from "../js/fetchData";
import { FaTimes, FaEye } from "react-icons/fa";
import { Zoom } from "react-awesome-reveal";

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const data = await fetchProjects();
      setProjects(data);
    };
    fetch();
  }, []);

  return (
    <section className="py-20 px-4 sm:px-8 md:px-12 lg:px-20 xl:px-32 bg-gray-900 text-yellow-400">
      <div className="max-w-6xl mx-auto">
        
        {/* Title */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center drop-shadow-md mb-10" id="projects">
          Projects
        </h2>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <Zoom key={project.id} duration={800} triggerOnce>
              <div
                className="relative bg-gray-800 p-6 rounded-lg shadow-md border border-yellow-500 cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-yellow-500 hover:border-yellow-300"
                onClick={() => setSelectedProject(project)}
              >
                <h3 className="text-xl font-semibold text-gray-200">{project.title}</h3>
                <p className="text-sm text-yellow-400 mt-2">{project.tech_used}</p>

                {/* Hover Indicator - Eye Icon */}
                <div className="absolute top-2 right-2 bg-yellow-500 text-gray-900 p-2 rounded-full shadow-md transition-transform duration-200 hover:scale-125">
                  <FaEye size={16} />
                </div>
              </div>
            </Zoom>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedProject && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-md z-50">
          <div className="bg-gray-900 text-yellow-400 p-6 rounded-lg shadow-xl max-w-lg w-full relative transform scale-100 transition-all duration-300">
            
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-yellow-300 transition-transform hover:scale-110"
              onClick={() => setSelectedProject(null)}
            >
              <FaTimes size={22} />
            </button>

            {/* Project Details */}
            <h3 className="text-2xl font-bold text-center">{selectedProject.title}</h3>
            <p className="text-sm text-yellow-400 text-center mt-2">{selectedProject.tech_used}</p>
            <p className="text-gray-300 mt-4">{selectedProject.description}</p>
            <ul className="mt-4 text-gray-300 list-disc list-inside space-y-1">
              {selectedProject.mypart.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
};

export default Projects;
