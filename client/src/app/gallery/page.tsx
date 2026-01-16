'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface GalleryItem {
  id: number;
  title: string;
  type: "text" | "image" | "video";
  thumbnail: string;
  author: string;
  likes: number;
  createdAt: string;
}

export default function Gallery() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Mock gallery data
  const galleryItems: GalleryItem[] = [
    {
      id: 1,
      title: "未来城市夜景",
      type: "image",
      thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2070&auto=format&fit=crop",
      author: "AI创作者001",
      likes: 128,
      createdAt: "2024-07-01"
    },
    {
      id: 2,
      title: "关于梦想的诗歌",
      type: "text",
      thumbnail: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=2072&auto=format&fit=crop",
      author: "AI创作者002",
      likes: 96,
      createdAt: "2024-07-02"
    },
    {
      id: 3,
      title: "自然景观纪录片",
      type: "video",
      thumbnail: "https://images.unsplash.com/photo-1501426026826-31c667bdf23d?q=80&w=2070&auto=format&fit=crop",
      author: "AI创作者003",
      likes: 204,
      createdAt: "2024-07-03"
    },
    {
      id: 4,
      title: "赛博朋克风格人物",
      type: "image",
      thumbnail: "https://images.unsplash.com/photo-1551650975-87deedd944c3?q=80&w=2070&auto=format&fit=crop",
      author: "AI创作者004",
      likes: 157,
      createdAt: "2024-07-04"
    },
    {
      id: 5,
      title: "科幻小说片段",
      type: "text",
      thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1974&auto=format&fit=crop",
      author: "AI创作者005",
      likes: 78,
      createdAt: "2024-07-05"
    },
    {
      id: 6,
      title: "抽象艺术作品",
      type: "image",
      thumbnail: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=2070&auto=format&fit=crop",
      author: "AI创作者006",
      likes: 182,
      createdAt: "2024-07-06"
    }
  ];

  const categories = [
    { id: "all", name: "全部" },
    { id: "image", name: "图像" },
    { id: "text", name: "文本" },
    { id: "video", name: "视频" }
  ];

  const filteredItems = galleryItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === null || selectedCategory === "all" || item.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            作品画廊
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            探索来自全球创作者的精彩AI生成作品，获取灵感和创意
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col md:flex-row gap-4 mb-10"
        >
          <div className="relative flex-grow">
            <Input
              placeholder="搜索作品..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id === "all" ? null : category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                <div className="relative">
                  <img 
                    src={item.thumbnail} 
                    alt={item.title} 
                    className="w-full h-60 object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                      {item.type === "text" ? "文本" : item.type === "image" ? "图像" : "视频"}
                    </div>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl line-clamp-1">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 mb-1">作者: {item.author}</div>
                  <div className="text-sm text-gray-500">{item.createdAt}</div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    {item.likes}
                  </div>
                  <Button variant="ghost" size="sm">查看详情</Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* No Results */}
        {filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16"
          >
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">未找到作品</h3>
            <p className="text-gray-500">尝试调整搜索条件或分类筛选</p>
          </motion.div>
        )}

        {/* Load More Button */}
        {filteredItems.length > 0 && (
          <div className="mt-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Button variant="outline" size="lg">
                加载更多
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}