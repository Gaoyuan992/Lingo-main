'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type GenerateType = "text" | "image" | "video";

export default function Generate() {
  const [generateType, setGenerateType] = useState<GenerateType>("text");
  const [prompt, setPrompt] = useState("");
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const generateContent = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setLoadingProgress(0);
    
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 300);

    try {
      // In a real app, you would call your backend API here
      // const response = await fetch('/api/generate', { ... });
      // For now, we'll simulate a delay and return dummy content
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      let content = "";
      switch (generateType) {
        case "text":
          content = "这是一段由AI生成的示例文本。Lingo的AI生成功能可以帮助你快速创建各种类型的内容，包括文章、故事、诗歌等。你只需要输入简短的提示词，AI就能为你生成高质量的文本内容。";
          break;
        case "image":
          content = "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?q=80&w=2070&auto=format&fit=crop";
          break;
        case "video":
          content = "https://example.com/dummy-video.mp4";
          break;
      }
      
      setGeneratedContent(content);
      setShowResultDialog(true);
      setLoadingProgress(100);
    } catch (error) {
      console.error("生成内容失败:", error);
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  const generateTypes = [
    { id: "text", label: "文本生成", icon: "📝" },
    { id: "image", label: "图像生成", icon: "🖼️" },
    { id: "video", label: "视频生成", icon: "🎬" }
  ];

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
            AI内容生成器
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            输入你的创意提示，让Lingo的AI为你生成高质量的文本、图像和视频内容
          </p>
        </motion.div>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl">生成设置</CardTitle>
            <CardDescription>
              选择你想要生成的内容类型，并输入详细的提示词
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  内容类型
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {generateTypes.map((type) => (
                    <motion.button
                      key={type.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setGenerateType(type.id as GenerateType)}
                      className={`p-4 rounded-lg border-2 transition-all ${generateType === type.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <div className="font-medium">{type.label}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  提示词
                </label>
                {generateType === "text" ? (
                  <Textarea
                    placeholder="请输入详细的文本生成提示，例如：写一篇关于未来城市的科幻小说片段"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px]"
                  />
                ) : (
                  <Input
                    placeholder={generateType === "image" ? "请输入图像生成提示，例如：一只在太空漂浮的猫，赛博朋克风格" : "请输入视频生成提示，例如：一段展示自然景观的4K视频"}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                )}
              </div>

              {generateType === "image" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      图像尺寸
                    </label>
                    <select className="w-full p-3 border border-gray-300 rounded-lg">
                      <option>1024x1024</option>
                      <option>1024x1536</option>
                      <option>1536x1024</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      风格
                    </label>
                    <select className="w-full p-3 border border-gray-300 rounded-lg">
                      <option>默认</option>
                      <option>赛博朋克</option>
                      <option>现实主义</option>
                      <option>卡通</option>
                      <option>印象派</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={generateContent}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>生成中... {loadingProgress}%</span>
                </div>
              ) : (
                "开始生成"
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Recently Generated Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-bold mb-6">最近生成</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <Card key={item} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  {item % 2 === 0 ? (
                    <div className="h-40 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="space-y-2 mb-2">
                      <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between items-center">
                  <span className="text-sm text-gray-500">2小时前</span>
                  <Button variant="ghost" size="sm">查看</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>生成结果</DialogTitle>
            <DialogDescription>
              这是根据你的提示生成的内容
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {generatedContent && (
              <div className="mt-4">
                {generateType === "image" ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-lg overflow-hidden"
                  >
                    <img src={generatedContent} alt="生成的图像" className="w-full h-auto" />
                  </motion.div>
                ) : generateType === "video" ? (
                  <div className="border border-gray-200 rounded-lg p-8 text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-600">视频生成功能开发中...</p>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="prose max-w-none"
                  >
                    <p className="text-gray-700 leading-relaxed">{generatedContent}</p>
                  </motion.div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResultDialog(false)}>
              关闭
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              保存作品
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}