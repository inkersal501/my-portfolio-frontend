import { useEffect, useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { fetchFaqs } from "../js/fetchData";
import { Fade } from "react-awesome-reveal";

const Faq = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const data = await fetchFaqs();
      setFaqs(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 px-6 bg-gray-900 text-yellow-400">
      <div className="max-w-4xl mx-auto">
        {/* Section Title */}
        <h2 className="text-4xl font-bold text-center mb-8 drop-shadow-md" id="faq">
          Frequently Asked Questions
        </h2>

        {/* Loader */}
        {loading ? (
          <p className="text-center text-yellow-300 text-lg">Loading FAQs...</p>
        ) : (
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Fade key={index} bottom duration={600} delay={index * 100}>
                <div
                  className="bg-gray-800 p-5 rounded-xl shadow-lg border border-yellow-500 
                  transition-all duration-300 hover:shadow-yellow-500"
                >
                  {/* Question */}
                  <button
                    className="w-full flex justify-between items-center text-lg font-semibold 
                    text-left focus:outline-none transition-transform duration-300"
                    onClick={() => toggleFAQ(index)}
                  >
                    <span className="flex-1">{faq.question}</span>
                    {openIndex === index ? (
                      <FaChevronUp className="transition-transform duration-300 transform rotate-180" />
                    ) : (
                      <FaChevronDown className="transition-transform duration-300" />
                    )}
                  </button>

                  {/* Answer */}
                  <Fade collapse when={openIndex === index}>
                    <div className="mt-3 text-gray-300 text-base leading-relaxed">
                      <p>{faq.answer}</p>
                    </div>
                  </Fade>
                </div>
              </Fade>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Faq;
