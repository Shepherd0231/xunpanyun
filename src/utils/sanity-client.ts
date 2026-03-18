import { createClient, type QueryParams } from '@sanity/client';

// Lazy initialization of Sanity client
let _sanityClient: ReturnType<typeof createClient> | null = null;

function getSanityClient(): ReturnType<typeof createClient> | null {
  if (_sanityClient) return _sanityClient;

  // Try to get from runtime env (Cloudflare) or process.env
  const projectId = (typeof process !== 'undefined' && process.env?.SANITY_PROJECT_ID) ||
                    (typeof globalThis !== 'undefined' && (globalThis as any).SANITY_PROJECT_ID) ||
                    '39od49xj'; // Default fallback

  const dataset = (typeof process !== 'undefined' && process.env?.SANITY_DATASET) ||
                  (typeof globalThis !== 'undefined' && (globalThis as any).SANITY_DATASET) ||
                  'production';

  if (!projectId) {
    console.warn('Sanity client not configured. Please set SANITY_PROJECT_ID environment variable.');
    return null;
  }

  _sanityClient = createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    useCdn: true,
    perspective: 'published',
  });

  return _sanityClient;
}

// Export getter function
export const sanityClient = getSanityClient();

// Type definitions for Sanity documents
export interface SanityPost {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  seoTitle?: string;
  seoDescription?: string;
  excerpt?: string;
  featuredImage?: {
    asset: {
      _ref: string;
    };
    hotspot?: {
      x: number;
      y: number;
    };
    alt?: string;
  };
  author?: {
    name: string;
    title?: string;
  };
  publishedAt: string;
  category?: string;
  tags?: string[];
  content: any[];
  language: string;
}

export interface SanityProduct {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  seoTitle?: string;
  seoDescription?: string;
  shortDescription?: string;
  fullDescription?: any[];
  featuredImage?: {
    asset: {
      _ref: string;
    };
    hotspot?: {
      x: number;
      y: number;
    };
    alt?: string;
  };
  gallery?: Array<{
    asset: {
      _ref: string;
    };
    alt?: string;
    caption?: string;
  }>;
  category?: string;
  material?: string;
  specifications?: {
    moq?: string;
    leadTime?: string;
    tolerance?: string;
    dimensions?: string;
  };
  certifications?: string[];
  industries?: string[];
  features?: string[];
  language: string;
}

// GROQ query for fetching a single post by slug
export async function getPostBySlug(slug: string, language: string = 'en'): Promise<SanityPost | null> {
  const client = getSanityClient();
  if (!client) {
    console.warn('Sanity client not configured. Please set SANITY_PROJECT_ID environment variable.');
    return null;
  }

  const query = `*[_type == "post" && slug.current == $slug && language == $language][0] {
    _id,
    title,
    slug,
    seoTitle,
    seoDescription,
    excerpt,
    featuredImage {
      asset {
        _ref
      },
      hotspot,
      alt
    },
    author {
      name,
      title
    },
    publishedAt,
    category,
    tags,
    content,
    language
  }`;

  try {
    return await client.fetch(query, { slug, language });
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

// GROQ query for fetching all posts
export async function getAllPosts(language: string = 'en', limit: number = 10): Promise<SanityPost[]> {
  const client = getSanityClient();
  if (!client) {
    console.warn('Sanity client not configured. Please set SANITY_PROJECT_ID environment variable.');
    return [];
  }

  const query = `*[_type == "post" && language == $language] | order(publishedAt desc) [0...$limit] {
    _id,
    title,
    slug {
      current
    },
    seoTitle,
    seoDescription,
    excerpt,
    featuredImage {
      asset {
        _ref
      },
      hotspot,
      alt
    },
    author {
      name
    },
    publishedAt,
    category,
    tags
  }`;

  try {
    return await client.fetch(query, { language, limit });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

// GROQ query for fetching a single product by slug
export async function getProductBySlug(slug: string, language: string = 'en'): Promise<SanityProduct | null> {
  const client = getSanityClient();
  if (!client) {
    console.warn('Sanity client not configured. Please set SANITY_PROJECT_ID environment variable.');
    return null;
  }

  const query = `*[_type == "product" && slug.current == $slug && language == $language][0] {
    _id,
    title,
    slug,
    seoTitle,
    seoDescription,
    shortDescription,
    fullDescription,
    featuredImage {
      asset {
        _ref
      },
      hotspot,
      alt
    },
    gallery[] {
      asset {
        _ref
      },
      alt,
      caption
    },
    category,
    material,
    specifications {
      moq,
      leadTime,
      tolerance,
      dimensions
    },
    certifications,
    industries,
    features,
    language
  }`;

  try {
    return await client.fetch(query, { slug, language });
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// GROQ query for fetching all products
export async function getAllProducts(language: string = 'en', limit: number = 10): Promise<SanityProduct[]> {
  const client = getSanityClient();
  if (!client) {
    console.warn('Sanity client not configured. Please set SANITY_PROJECT_ID environment variable.');
    return [];
  }

  const query = `*[_type == "product" && language == $language] | order(_createdAt desc) [0...$limit] {
    _id,
    title,
    slug {
      current
    },
    seoTitle,
    seoDescription,
    shortDescription,
    featuredImage {
      asset {
        _ref
      },
      hotspot,
      alt
    },
    category,
    material,
    specifications {
      moq,
      leadTime
    },
    certifications
  }`;

  try {
    return await client.fetch(query, { language, limit });
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// Helper function to get SEO data from Sanity document
export function getSEOMeta(document: SanityPost | SanityProduct | null) {
  if (!document) {
    return {
      title: '',
      description: '',
    };
  }

  return {
    title: document.seoTitle || document.title,
    description: document.seoDescription || '',
  };
}

// Generic fetch function for custom queries
export async function sanityFetch<T>(
  query: string,
  params: QueryParams = {}
): Promise<T | null> {
  const client = getSanityClient();
  if (!client) {
    console.warn('Sanity client not configured. Please set SANITY_PROJECT_ID environment variable.');
    return null;
  }

  try {
    return await client.fetch(query, params);
  } catch (error) {
    console.error('Sanity fetch error:', error);
    return null;
  }
}
