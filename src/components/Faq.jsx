const Faq = () => {
    const faqs = [
      {
        question: "What technologies do you specialize in?",
        answer: "I specialize in React, Node.js, PHP, AWS, and MySQL.",
      },
      {
        question: "Do you take freelance projects?",
        answer: "Yes! Feel free to reach out to discuss your project.",
      },
    ];
  
    return (
      <section className="py-15">
        <h2 className="text-3xl font-semibold text-center mb-6" id="faq">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-gray-800 p-5 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold">{faq.question}</h3>
              <p className="text-gray-400 mt-2">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    );
  };
 export default Faq;