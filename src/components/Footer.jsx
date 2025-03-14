const Footer = () => (
  <footer className="text-center text-gray-400 py-6">
    <p>Last Updated {new Date().toLocaleString()} </p>
    <p>© {new Date().getFullYear()} Inkersal Mahendran. All rights reserved.</p>
  </footer>
);
export default Footer;