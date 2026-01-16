'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ForumPost {
  id: number;
  title: string;
  content: string;
  author: string;
  avatar: string;
  replies: number;
  likes: number;
  createdAt: string;
}

export default function Community() {
  const [posts, setPosts] = useState<ForumPost[]>([
    {
      id: 1,
      title: "如何提高AI图像生成的质量？",
      content: "大家好，我想请教一下如何通过优化提示词来提高AI生成图像的质量？有什么技巧可以分享吗？",
      author: "创意达人",
      avatar: "https://ui-avatars.com/api/?name=创意达人&background=random",
      replies: 12,
      likes: 45,
      createdAt: "2小时前"
    },
    {
      id: 2,
      title: "分享我的AI小说创作经验",
      content: "最近用Lingo生成了一部科幻小说，效果非常不错！想和大家分享一下我的创作心得和提示词技巧...",
      author: "小说作家",
      avatar: "https://ui-avatars.com/api/?name=小说作家&background=random",
      replies: 23,
      likes: 78,
      createdAt: "5小时前"
    },
    {
      id: 3,
      title: "AI视频生成的未来发展方向",
      content: "随着技术的发展，AI视频生成会有哪些新的突破？大家对未来的AI视频创作有什么看法？",
      author: "科技爱好者",
      avatar: "https://ui-avatars.com/api/?name=科技爱好者&background=random",
      replies: 18,
      likes: 62,
      createdAt: "1天前"
    }
  ]);

  const [newPost, setNewPost] = useState({
    title: "",
    content: ""
  });

  const [showNewPostForm, setShowNewPostForm] = useState(false);

  const handleNewPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    
    const post: ForumPost = {
      id: posts.length + 1,
      title: newPost.title,
      content: newPost.content,
      author: "当前用户",
      avatar: "https://ui-avatars.com/api/?name=当前用户&background=random",
      replies: 0,
      likes: 0,
      createdAt: "刚刚"
    };
    
    setPosts([post, ...posts]);
    setNewPost({ title: "", content: "" });
    setShowNewPostForm(false);
  };

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    ));
  };

  return (
    <div className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            社区交流
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            与全球创作者交流经验，分享AI创作技巧，共同成长
          </p>
        </motion.div>

        {/* New Post Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Button 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={() => setShowNewPostForm(!showNewPostForm)}
          >
            {showNewPostForm ? "取消" : "发布新帖子"}
          </Button>
        </motion.div>

        {/* New Post Form */}
        {showNewPostForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>发布新帖子</CardTitle>
              </CardHeader>
              <form onSubmit={handleNewPost}>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      标题
                    </label>
                    <Input
                      placeholder="输入帖子标题"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      内容
                    </label>
                    <Textarea
                      placeholder="分享你的想法或问题..."
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      className="min-h-[120px]"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit">发布帖子</Button>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        )}

        {/* Forum Posts */}
        <div className="space-y-6">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <img src={post.avatar} alt={post.author} className="w-12 h-12 rounded-full" />
                    <div>
                      <CardTitle className="text-xl">{post.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{post.author}</span>
                        <span>•</span>
                        <span>{post.createdAt}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{post.content}</p>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <div className="flex gap-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleLike(post.id)}
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      {post.likes}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {post.replies} 回复
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm">
                    分享
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}