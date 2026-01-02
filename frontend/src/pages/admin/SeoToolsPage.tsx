
import React from 'react';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface SeoTool {
  name: string;
  description: string;
  link: string;
  note?: string;
}

const seoToolsList: SeoTool[] = [
  {
    name: "Google Search Console",
    description: "Essential for understanding how Google sees your site. Monitor indexing, submit sitemaps, see search queries, identify crawl errors, and get alerts for issues.",
    link: "https://search.google.com/search-console",
  },
  {
    name: "Google Analytics",
    description: "Tracks website traffic, user behavior (pages visited, time on page, bounce rate), traffic sources, conversions, and audience demographics.",
    link: "https://analytics.google.com/",
  },
  {
    name: "Google Trends",
    description: "Explores the popularity of search queries over time. Useful for keyword research, identifying seasonal trends, and understanding content demand.",
    link: "https://trends.google.com/",
  },
  {
    name: "Google Keyword Planner",
    description: "Discovers new keywords, gets search volume data, and forecasts keyword performance. Helps in SEO keyword research.",
    link: "https://ads.google.com/home/tools/keyword-planner/",
    note: "Requires a Google Ads account (you don't need to run ads to use it)."
  },
  {
    name: "Ahrefs Webmaster Tools (AWT)",
    description: "A free version of Ahrefs' SEO suite. Monitor your site's SEO health, check backlinks, and see keywords you rank for.",
    link: "https://ahrefs.com/webmaster-tools",
  },
  {
    name: "Semrush (Free Account)",
    description: "Offers a limited free account for domain analysis, keyword research, and site audits. Good for competitive analysis and on-page SEO issues.",
    link: "https://www.semrush.com/",
  },
  {
    name: "MozBar (Browser Extension)",
    description: "A Chrome extension providing on-page SEO metrics like Domain Authority (DA), Page Authority (PA), and link analysis directly in your browser.",
    link: "https://moz.com/products/mozbar",
  },
  {
    name: "Screaming Frog SEO Spider",
    description: "A desktop program that crawls your website's URLs for technical and on-page SEO audits. Finds broken links, analyzes page titles/meta descriptions, etc.",
    link: "https://www.screamingfrog.co.uk/seo-spider/",
    note: "Free version limited to 500 URLs."
  },
  {
    name: "AnswerThePublic",
    description: "Visualizes search questions and queries related to a keyword, helping understand user intent and generate content ideas.",
    link: "https://answerthepublic.com/",
    note: "Free version offers limited daily searches."
  },
  {
    name: "Ubersuggest",
    description: "Provides keyword suggestions, content ideas, and backlink data. Offers a decent amount of free functionality.",
    link: "https://neilpatel.com/ubersuggest/",
  },
];

const LinkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-4 h-4"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
);


const SeoToolsPage: React.FC = () => {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-slate-100">SEO Tools & Resources</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          A curated list of free Search Engine Optimization (SEO) tools to help improve your website's visibility and performance.
        </p>
      </div>

      <div className="space-y-6">
        {seoToolsList.map((tool) => (
          <Card key={tool.name} className="dark:bg-slate-800">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200">{tool.name}</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-slate-300 mb-2">
                {tool.description}
              </p>
              {tool.note && (
                <p className="text-xs text-amber-600 dark:text-amber-400 italic mb-3">Note: {tool.note}</p>
              )}
              <Button 
                asLink 
                to={tool.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                variant="outline" 
                size="sm"
                className="dark:text-purple-400 dark:border-purple-400 dark:hover:bg-purple-700 dark:hover:text-white"
              >
                <LinkIcon className="mr-1.5" />
                Visit Tool
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
       <div className="mt-8 p-4 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-md text-purple-700 dark:text-purple-300">
            <h3 className="text-lg font-semibold mb-2">General SEO Tips:</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
                <li>**Combine Tools:** No single free tool does everything. Use a combination to get a more holistic view.</li>
                <li>**Focus on Google's Tools First:** Google Search Console and Google Analytics are non-negotiable for any website.</li>
                <li>**Understand Limitations:** Free versions often have restrictions on data volume, features, or daily usage.</li>
                <li>**Learn the Basics:** Tools are more effective when you understand fundamental SEO concepts (keywords, on-page SEO, technical SEO, link building).</li>
                <li>**Content is King:** Create high-quality, relevant content that serves your church community and visitors.</li>
                <li>**Mobile-Friendliness:** Ensure your website is responsive and performs well on mobile devices.</li>
                <li>**Page Speed:** Optimize images and code for fast loading times.</li>
                <li>**Local SEO:** For a church, ensure your Google Business Profile (if applicable) is up-to-date and accurate.</li>
            </ul>
        </div>
    </div>
  );
};

export default SeoToolsPage;