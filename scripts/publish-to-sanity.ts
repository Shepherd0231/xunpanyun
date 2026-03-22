#!/usr/bin/env tsx
/**
 * MD + Image to Sanity Publishing Automation Script
 * 
 * Workflow:
 * 1. Read MD files from /drafts/
 * 2. Extract frontmatter and content
 * 3. Generate slug from title
 * 4. Upload local images to Sanity Assets API
 * 5. Call Kimi API (moonshot-v1-8k) to generate SEO description and translations
 * 6. Write to Sanity database via Mutations API
 */

import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { createClient } from '@sanity/client';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Sanity client configuration
const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || '',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_WRITE_TOKEN || '',
  apiVersion: '2024-01-01',
  useCdn: false,
});

// OpenAI client for Kimi API
const kimiClient = new OpenAI({
  apiKey: process.env.KIMI_API_KEY || '',
  baseURL: 'https://api.moonshot.cn/v1',
});

// Slugify function
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[&@#$%^*()_+=\[\]{};':"\\|,.<>\/?]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '');
}

// Extract local image paths from markdown content
function extractImagePaths(content: string): string[] {
  const imageRegex = /!\[.*?\]\((\.\/[^)]+)\)/g;
  const paths: string[] = [];
  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    paths.push(match[1]);
  }
  return paths;
}

// Upload image to Sanity
async function uploadImageToSanity(imagePath: string, draftsDir: string): Promise<string | null> {
  try {
    const fullPath = path.join(draftsDir, imagePath);
    const imageBuffer = await fs.readFile(fullPath);
    const filename = path.basename(imagePath);
    
    const asset = await sanityClient.assets.upload('image', imageBuffer, {
      filename,
    });
    
    console.log(`✓ Uploaded image: ${filename} -> ${asset._id}`);
    return asset._id;
  } catch (error) {
    console.error(`✗ Failed to upload image ${imagePath}:`, error);
    return null;
  }
}

// Replace local image paths with Sanity asset references
async function processImages(content: string, draftsDir: string): Promise<{ processedContent: string; imageRefs: Map<string, string> }> {
  const imagePaths = extractImagePaths(content);
  const imageRefs = new Map<string, string>();
  
  for (const imgPath of imagePaths) {
    const assetId = await uploadImageToSanity(imgPath, draftsDir);
    if (assetId) {
      imageRefs.set(imgPath, assetId);
    }
  }
  
  let processedContent = content;
  imageRefs.forEach((assetId, imgPath) => {
    const regex = new RegExp(`!\\[(.*?)\\]\\(${escapeRegExp(imgPath)}\\)`, 'g');
    // Mark for Portable Text conversion later
    processedContent = processedContent.replace(regex, `[IMAGE:${assetId}:$1]`);
  });
  
  return { processedContent, imageRefs };
}

// Escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Generate SEO description using Kimi API
async function generateSEODescription(title: string, content: string): Promise<string> {
  try {
    const response = await kimiClient.chat.completions.create({
      model: 'moonshot-v1-8k',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO expert. Generate a compelling meta description (max 160 characters) for the following article. Focus on key benefits and include relevant keywords.',
        },
        {
          role: 'user',
          content: `Title: ${title}\n\nContent preview: ${content.slice(0, 500)}...`,
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });
    
    const description = response.choices[0]?.message?.content?.trim() || '';
    return description.slice(0, 160);
  } catch (error) {
    console.error('Failed to generate SEO description:', error);
    return '';
  }
}

// Translate content using Kimi API
async function translateContent(text: string, targetLang: string): Promise<string> {
  const langNames: Record<string, string> = {
    zh: 'Chinese',
    de: 'German',
  };
  
  try {
    const response = await kimiClient.chat.completions.create({
      model: 'moonshot-v1-8k',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text to ${langNames[targetLang]}. Maintain the original meaning and tone.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });
    
    return response.choices[0]?.message?.content?.trim() || text;
  } catch (error) {
    console.error(`Failed to translate to ${targetLang}:`, error);
    return text;
  }
}

// Convert markdown to Portable Text blocks
function markdownToPortableText(content: string): any[] {
  const blocks: any[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Handle image placeholders
    if (trimmed.startsWith('[IMAGE:')) {
      const match = trimmed.match(/\[IMAGE:([^:]+):([^\]]*)\]/);
      if (match) {
        blocks.push({
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: match[1],
          },
          alt: match[2] || '',
        });
      }
      continue;
    }
    
    // Handle headings
    if (trimmed.startsWith('## ')) {
      blocks.push({
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: trimmed.slice(3) }],
      });
      continue;
    }
    
    if (trimmed.startsWith('### ')) {
      blocks.push({
        _type: 'block',
        style: 'h3',
        children: [{ _type: 'span', text: trimmed.slice(4) }],
      });
      continue;
    }
    
    // Handle bullet lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      blocks.push({
        _type: 'block',
        style: 'normal',
        listItem: 'bullet',
        children: [{ _type: 'span', text: trimmed.slice(2) }],
      });
      continue;
    }
    
    // Handle numbered lists
    if (/^\d+\.\s/.test(trimmed)) {
      const text = trimmed.replace(/^\d+\.\s/, '');
      blocks.push({
        _type: 'block',
        style: 'normal',
        listItem: 'number',
        children: [{ _type: 'span', text }],
      });
      continue;
    }
    
    // Regular paragraph
    if (trimmed) {
      blocks.push({
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: trimmed }],
      });
    }
  }
  
  return blocks;
}

// Process a single MD file
async function processMarkdownFile(filePath: string): Promise<void> {
  console.log(`\nProcessing: ${path.basename(filePath)}`);
  
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(fileContent);
    const draftsDir = path.dirname(filePath);
    
    // Validate required fields
    if (!frontmatter.title) {
      throw new Error('Missing required field: title');
    }
    
    // Generate slug
    const slug = slugify(frontmatter.title);
    console.log(`  Slug: ${slug}`);
    
    // Process images
    console.log('  Processing images...');
    const { processedContent } = await processImages(content, draftsDir);
    
    // Convert to Portable Text
    const portableTextContent = markdownToPortableText(processedContent);
    
    // Generate SEO description if not provided
    let seoDescription = frontmatter.seoDescription || '';
    if (!seoDescription) {
      console.log('  Generating SEO description with Kimi API...');
      seoDescription = await generateSEODescription(frontmatter.title, content);
    }
    
    // Prepare base document
    const baseDoc = {
      _type: frontmatter.type || 'post',
      title: frontmatter.title,
      slug: {
        _type: 'slug',
        current: slug,
      },
      seoTitle: frontmatter.seoTitle || frontmatter.title,
      seoDescription,
      excerpt: frontmatter.excerpt || '',
      content: portableTextContent,
      category: frontmatter.category || 'industry-insights',
      tags: frontmatter.tags || [],
      language: 'en',
      publishedAt: frontmatter.date || new Date().toISOString(),
    };
    
    // Create English version
    console.log('  Creating English document...');
    const englishDoc = await sanityClient.create(baseDoc);
    console.log(`  ✓ Created: ${englishDoc._id}`);
    
    // Generate translations
    console.log('  Generating translations...');
    
    // Chinese translation
    const chineseTitle = await translateContent(frontmatter.title, 'zh');
    const chineseDescription = await translateContent(seoDescription, 'zh');
    const chineseContent = await translateContent(content, 'zh');
    
    const chineseDoc = await sanityClient.create({
      ...baseDoc,
      title: chineseTitle,
      seoTitle: chineseTitle,
      seoDescription: chineseDescription,
      content: markdownToPortableText(chineseContent),
      language: 'zh',
    });
    console.log(`  ✓ Created Chinese version: ${chineseDoc._id}`);
    
    // German translation
    const germanTitle = await translateContent(frontmatter.title, 'de');
    const germanDescription = await translateContent(seoDescription, 'de');
    const germanContent = await translateContent(content, 'de');
    
    const germanDoc = await sanityClient.create({
      ...baseDoc,
      title: germanTitle,
      seoTitle: germanTitle,
      seoDescription: germanDescription,
      content: markdownToPortableText(germanContent),
      language: 'de',
    });
    console.log(`  ✓ Created German version: ${germanDoc._id}`);
    
    // Move processed file to archive
    const archiveDir = path.join(draftsDir, 'processed');
    await fs.mkdir(archiveDir, { recursive: true });
    await fs.rename(filePath, path.join(archiveDir, path.basename(filePath)));
    console.log(`  ✓ Moved to archive`);
    
  } catch (error) {
    console.error(`  ✗ Error processing file:`, error);
  }
}

// Main function
async function main(): Promise<void> {
  console.log('🚀 Starting MD to Sanity publishing automation...\n');
  
  // Validate environment variables
  if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_WRITE_TOKEN) {
    console.error('❌ Missing required environment variables: SANITY_PROJECT_ID, SANITY_WRITE_TOKEN');
    process.exit(1);
  }
  
  const draftsDir = path.join(process.cwd(), 'drafts');
  
  try {
    // Check if drafts directory exists
    await fs.access(draftsDir);
  } catch {
    console.error(`❌ Drafts directory not found: ${draftsDir}`);
    process.exit(1);
  }
  
  // Get all MD files
  const files = await fs.readdir(draftsDir);
  const mdFiles = files.filter((f) => f.endsWith('.md'));
  
  if (mdFiles.length === 0) {
    console.log('ℹ️ No markdown files found in /drafts/');
    return;
  }
  
  console.log(`Found ${mdFiles.length} markdown file(s) to process\n`);
  
  // Process each file
  for (const file of mdFiles) {
    await processMarkdownFile(path.join(draftsDir, file));
  }
  
  console.log('\n✅ Publishing automation completed!');
}

// Run main function
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
