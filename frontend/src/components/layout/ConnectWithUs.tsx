import React from 'react';
import Card, { CardContent, CardHeader } from '../ui/Card';
import SocialIcons from '../ui/SocialIcons';

const connectSocialLinks = [
    { platform: 'facebook', url: 'https://facebook.com/yourchurchpage', label: 'BEM Church on Facebook' },
    { platform: 'youtube', url: 'https://youtube.com/yourchurchchannel', label: 'BEM Church on YouTube' },
    { platform: 'instagram', url: 'https://instagram.com/yourchurchprofile', label: 'BEM Church on Instagram' },
];

const ConnectWithUs: React.FC = () => {
  return (
    <section id="connect-with-us" className="scroll-mt-20 text-center py-12 px-4 bg-slate-50">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <h2 className="text-3xl font-bold text-slate-800">Connect With Us</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-slate-600">
            <p>Gauri Marg, Sinamangal, Kathmandu</p>
            <p><a href="mailto:shahidsingh1432@gmail.com" className="hover:text-purple-600 transition-colors">shahidsingh1432@gmail.com</a></p>
            <p><a href="tel:+9779865272258" className="hover:text-purple-600 transition-colors">+977-9865272258</a></p>
          </div>
          <div className="mt-4 flex justify-center">
            <SocialIcons links={connectSocialLinks} iconClassName="text-slate-500 hover:text-purple-600 transition-colors w-8 h-8" />
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default ConnectWithUs;