
import React from 'react';
import { useContent } from '../contexts/ContentContext'; 
import BlogPostCard from '../components/blog/BlogPostCard'; 
import { BlogPost } from '../types';
import AdSlot from '../components/ads/AdSlot';

const BlogPage: React.FC = () => {
  const { blogPosts, loadingContent } = useContent(); 

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pb-12">
        
        <AdSlot placementKey="blog_list_top" />

        {loadingContent && blogPosts.length === 0 && (
            <p className="text-center text-gray-500 text-lg">Loading blog posts...</p>
        )}

        {!loadingContent && blogPosts.length === 0 && (
           <p className="text-center text-gray-500 text-lg py-10 bg-white rounded-lg shadow">
            No blog posts available at this time. Please check back later.
           </p>
        )}

        {!loadingContent && blogPosts.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post: BlogPost) => ( 
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
