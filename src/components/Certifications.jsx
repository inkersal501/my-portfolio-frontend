const Certifications = () => {
    const certifications = [
      "AWS Certified Solutions Architect",
      "Full-Stack Developer Nanodegree",
      "Google Cloud Associate",
    ];
  
    return (
      <section className="py-15">
        <h2 className="text-3xl font-semibold text-center mb-6" id="certifications">Certifications & Achievements</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certifications.map((cert, index) => (
            <div key={index} className="bg-gray-800 p-5 rounded-lg shadow-md text-center">
              <p className="text-gray-200 font-semibold">{cert}</p>
            </div>
          ))}
        </div>
      </section>
    );
  };
  export default Certifications;