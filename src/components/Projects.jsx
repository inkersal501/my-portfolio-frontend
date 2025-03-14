const Projects = () => {
  const projectData = [
    {
      title: "Project 1",
      description: "A modern web application built with React and Node.js. Implements authentication, API integration, and a responsive UI. Optimized for high performance and SEO.",
    },
    {
      title: "Project 2",
      description: "An e-commerce platform developed with PHP and MySQL. Features a secure payment gateway, dynamic product catalog, and an intuitive admin dashboard.",
    },
    {
      title: "Project 3",
      description: "A real-time chat application using WebSockets. Supports private messaging, group chats, and push notifications for instant communication.",
    },
  ];

  return (
    <section className="py-20">
      <h2 className="text-3xl font-semibold text-center mb-6" id="projects">Projects</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projectData.map((project, index) => (
          <div
            key={index}
            className="bg-gray-800 p-5 rounded-lg shadow-md transform transition duration-300 hover:scale-105"
          >
            <h3 className="text-xl font-semibold">{project.title}</h3>
            <p className="text-gray-400 mt-2">{project.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

  export default Projects;