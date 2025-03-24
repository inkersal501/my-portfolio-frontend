import { useState, useEffect } from "react";

// eslint-disable-next-line react/prop-types
const TypingEffect = ({ text, speed = 75 }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    setDisplayedText(""); // Reset when text changes

    const interval = setInterval(() => {
      // eslint-disable-next-line react/prop-types
      if (index < text.length) {
        // eslint-disable-next-line react/prop-types
        setDisplayedText(text.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval); // Cleanup on unmount or text change
  }, [text, speed]);

  return <span>{displayedText}</span>;
};

export default TypingEffect;
