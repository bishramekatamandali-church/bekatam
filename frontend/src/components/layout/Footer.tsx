import React from 'react';
import { Link } from "react-router-dom";
import SocialIcons from '../ui/SocialIcons'; 
import AdSlot from '../ads/AdSlot';

const footerSocialLinks = [
    { platform: 'facebook', url: 'https://facebook.com/yourchurchpage', label: 'BEM Church on Facebook' },
    { platform: 'youtube', url: 'https://youtube.com/yourchurchchannel', label: 'BEM Church on YouTube' },
    { platform: 'instagram', url: 'https://instagram.com/yourchurchprofile', label: 'BEM Church on Instagram' },
];


const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-indigo-800 text-indigo-200 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AdSlot placementKey="footer_banner" className="mb-8 mt-0" /> 
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-teal-300 transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-teal-300 transition-colors">About Us</Link></li>
              <li><Link to="/events" className="hover:text-teal-300 transition-colors">Events</Link></li>
              <li><Link to="/sermons" className="hover:text-teal-300 transition-colors">Sermons</Link></li>
              <li><Link to="/contact" className="hover:text-teal-300 transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Connect With Us */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Connect With Us</h3>
            <div className="space-y-2 text-sm">
              <p>Gauri Marg, Sinamangal, Kathmandu</p>
              <p><span className="font-semibold">Email:</span> <a href="mailto:shahidsingh1432@gmail.com" className="hover:text-teal-300 transition-colors">shahidsingh1432@gmail.com</a></p>
              <p><span className="font-semibold">Phone:</span> <a href="tel:+9779865272258" className="hover:text-teal-300 transition-colors">+977-9865272258</a></p>
              <p>Sabbath Fellowship (Saturday): 10:00 AM - 2:00 PM</p>
            </div>
          </div>

          {/* Social Icons */}
          <div className="md:text-left"> {/* Adjusted for consistency, or md:text-right if preferred */}
            <h3 className="text-lg font-semibold text-white mb-3">Follow Us</h3>
            <SocialIcons links={footerSocialLinks} iconClassName="text-indigo-300 hover:text-teal-300 transition-colors" />
          </div>
        </div>
        
        <div className="border-t border-indigo-700 pt-6 text-center text-xs">
          <p>© {currentYear} Bishram Ekata Mandali. All rights reserved.</p>
          <p className="mt-0.5">Website by : Bishram Ekata Mandali</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;