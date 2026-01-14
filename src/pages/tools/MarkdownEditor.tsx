import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft, Download, Copy, FileText, Eye, Code,
  Bold, Italic, Heading1, Heading2, Link as LinkIcon,
  Image, List, Quote, CheckCircle2, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const TEMPLATES = {
  blank: '',
  readme: `# Project Title

## Description
A brief description of your project.

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
\`\`\`javascript
const example = "Hello World";
console.log(example);
\`\`\`

## Features
- Feature 1
- Feature 2
- Feature 3

## Contributing
Pull requests are welcome!

## License
MIT`,
  notes: `# Study Notes

## Topic: [Subject Name]

### Key Concepts
- Concept 1
- Concept 2
- Concept 3

### Important Formulas
\`\`\`
Formula 1: E = mc²
Formula 2: a² + b² = c²
\`\`\`

### Examples
1. Example 1
2. Example 2

### References
- [Resource 1](https://example.com)
- [Resource 2](https://example.com)`,
  documentation: `# API Documentation

## Overview
Brief overview of the API.

## Endpoints

### GET /api/users
Returns a list of users.

**Parameters:**
- \`limit\` (optional): Number of users to return
- \`offset\` (optional): Pagination offset

**Response:**
\`\`\`json
{
  "users": [],
  "total": 0
}
\`\`\`

### POST /api/users
Creates a new user.

**Request Body:**
\`\`\`json
{
  "name": "John Doe",
  "email": "john@example.com"
}
\`\`\``,
};

export default function MarkdownEditor() {
  const [markdown, setMarkdown] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('markdownContent');
    if (saved) {
      setMarkdown(saved);
    } else {
      setMarkdown('# Welcome to Markdown Editor\n\nStart typing to see the magic! ✨');
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('markdownContent', markdown);
    }, 1000);

    return () => clearTimeout(timer);
  }, [markdown]);

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdown.substring(start, end);
    const newText = markdown.substring(0, start) + before + selectedText + after + markdown.substring(end);

    setMarkdown(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const toolbarButtons = [
    { icon: Heading1, label: 'H1', action: () => insertMarkdown('# ', '\n') },
    { icon: Heading2, label: 'H2', action: () => insertMarkdown('## ', '\n') },
    { icon: Bold, label: 'Bold', action: () => insertMarkdown('**', '**') },
    { icon: Italic, label: 'Italic', action: () => insertMarkdown('*', '*') },
    { icon: Code, label: 'Code', action: () => insertMarkdown('`', '`') },
    { icon: LinkIcon, label: 'Link', action: () => insertMarkdown('[', '](url)') },
    { icon: Image, label: 'Image', action: () => insertMarkdown('![alt](', ')') },
    { icon: List, label: 'List', action: () => insertMarkdown('- ', '\n') },
    { icon: Quote, label: 'Quote', action: () => insertMarkdown('> ', '\n') },
  ];

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Markdown file downloaded!');
  };

  const downloadHTML = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Document</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 20px; color: #666; }
    img { max-width: 100%; }
  </style>
</head>
<body>
  ${document.querySelector('.markdown-preview')?.innerHTML || ''}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('HTML file downloaded!');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdown);
    toast.success('Copied to clipboard!');
  };

  const loadTemplate = (template: keyof typeof TEMPLATES) => {
    setMarkdown(TEMPLATES[template]);
    toast.success('Template loaded!');
  };

  const stats = {
    words: markdown.trim().split(/\s+/).filter(Boolean).length,
    characters: markdown.length,
    lines: markdown.split('\n').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="glass border-b border-border">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-black text-foreground">Markdown Editor</h1>
                <p className="text-sm text-muted-foreground font-medium">Write beautiful documentation</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={copyToClipboard}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={downloadMarkdown}
              >
                <Download className="w-4 h-4 mr-2" />
                MD
              </Button>
              <Button
                variant="default"
                size="sm"
                className="rounded-xl"
                onClick={downloadHTML}
              >
                <Download className="w-4 h-4 mr-2" />
                HTML
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Stats Card */}
            <Card className="glass-card rounded-3xl border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-black text-foreground">Statistics</h2>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Words', value: stats.words, icon: FileText },
                  { label: 'Characters', value: stats.characters, icon: CheckCircle2 },
                  { label: 'Lines', value: stats.lines, icon: List },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between p-3 rounded-2xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      <stat.icon className="w-4 h-4 text-primary" />
                      <span className="text-sm font-bold text-muted-foreground">{stat.label}</span>
                    </div>
                    <span className="text-lg font-black text-foreground">{stat.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Templates Card */}
            <Card className="glass-card rounded-3xl border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-black text-foreground">Templates</h2>
              </div>

              <div className="space-y-2">
                {Object.keys(TEMPLATES).map((template) => (
                  <Button
                    key={template}
                    variant="outline"
                    className="w-full justify-start rounded-xl"
                    onClick={() => loadTemplate(template as keyof typeof TEMPLATES)}
                  >
                    {template.charAt(0).toUpperCase() + template.slice(1)}
                  </Button>
                ))}
              </div>
            </Card>

            {/* View Mode Toggle */}
            <Card className="glass-card rounded-3xl border border-border p-6">
              <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-4">
                View Mode
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { mode: 'split', icon: Code, label: 'Split' },
                  { mode: 'edit', icon: FileText, label: 'Edit' },
                  { mode: 'preview', icon: Eye, label: 'Preview' },
                ].map((item) => (
                  <Button
                    key={item.mode}
                    variant={viewMode === item.mode ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-xl flex-col h-auto py-3"
                    onClick={() => setViewMode(item.mode as any)}
                  >
                    <item.icon className="w-4 h-4 mb-1" />
                    <span className="text-xs">{item.label}</span>
                  </Button>
                ))}
              </div>
            </Card>
          </div>

          {/* Editor Area */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-3xl border border-border overflow-hidden"
            >
              {/* Toolbar */}
              <div className="border-b border-border p-4 bg-muted/30">
                <div className="flex flex-wrap items-center gap-2">
                  {toolbarButtons.map((btn) => (
                    <Button
                      key={btn.label}
                      variant="ghost"
                      size="sm"
                      className="rounded-xl"
                      onClick={btn.action}
                      title={btn.label}
                    >
                      <btn.icon className="w-4 h-4" />
                    </Button>
                  ))}
                </div>
              </div>

              {/* Editor/Preview Area */}
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-x divide-border min-h-[600px]">
                {/* Editor */}
                {(viewMode === 'split' || viewMode === 'edit') && (
                  <div className={viewMode === 'edit' ? 'lg:col-span-2' : ''}>
                    <textarea
                      value={markdown}
                      onChange={(e) => setMarkdown(e.target.value)}
                      className="w-full h-full min-h-[600px] p-6 bg-transparent text-foreground font-mono text-sm resize-none focus:outline-none"
                      placeholder="Start typing your markdown here..."
                      spellCheck={false}
                    />
                  </div>
                )}

                {/* Preview */}
                {(viewMode === 'split' || viewMode === 'preview') && (
                  <div className={viewMode === 'preview' ? 'lg:col-span-2' : ''}>
                    <div className="p-6 prose prose-invert max-w-none markdown-preview">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => <h1 className="text-4xl font-black text-foreground mb-4">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-3xl font-black text-foreground mb-3 mt-8">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-2xl font-bold text-foreground mb-2 mt-6">{children}</h3>,
                          p: ({ children }) => <p className="text-muted-foreground mb-4 leading-relaxed">{children}</p>,
                          a: ({ href, children }) => (
                            <a href={href} className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer">
                              {children}
                            </a>
                          ),
                          code: ({ children }) => (
                            <code className="bg-muted px-2 py-1 rounded text-sm font-mono text-primary">
                              {children}
                            </code>
                          ),
                          pre: ({ children }) => (
                            <pre className="bg-muted p-4 rounded-2xl overflow-x-auto mb-4 border border-border">
                              {children}
                            </pre>
                          ),
                          ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2 text-muted-foreground">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-muted-foreground">{children}</ol>,
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
                              {children}
                            </blockquote>
                          ),
                          img: ({ src, alt }) => (
                            <img src={src} alt={alt} className="rounded-2xl max-w-full h-auto my-4 border border-border" />
                          ),
                        }}
                      >
                        {markdown || '*Preview will appear here...*'}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
