import { defineField, defineType } from 'sanity';

const mySlugify = (input: string) => {
  return input
    .toLowerCase()
    .trim()
    .replace(/[&@#$%^*()_+=\[\]{};':"\\|,.<>\/?]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '');
};

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Product Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        slugify: mySlugify,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      description: 'Title for search engines (50-60 characters recommended)',
      validation: (Rule) => Rule.max(70).warning('SEO titles should be under 70 characters'),
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 3,
      description: 'Meta description for search engines (150-160 characters recommended)',
      validation: (Rule) => Rule.max(160).warning('SEO descriptions should be under 160 characters'),
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      rows: 2,
      description: 'Brief description for product listings',
    }),
    defineField({
      name: 'fullDescription',
      title: 'Full Description',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
          ],
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Number', value: 'number' },
          ],
        },
      ],
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Alternative text for accessibility and SEO',
        }),
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Image Gallery',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt Text',
              type: 'string',
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Machining', value: 'machining' },
          { title: 'Fabrication', value: 'fabrication' },
          { title: 'Automation', value: 'automation' },
          { title: 'Components', value: 'components' },
        ],
      },
    }),
    defineField({
      name: 'material',
      title: 'Material',
      type: 'string',
      description: 'Primary materials used',
    }),
    defineField({
      name: 'specifications',
      title: 'Specifications',
      type: 'object',
      fields: [
        defineField({
          name: 'moq',
          title: 'Minimum Order Quantity',
          type: 'string',
        }),
        defineField({
          name: 'leadTime',
          title: 'Lead Time',
          type: 'string',
        }),
        defineField({
          name: 'tolerance',
          title: 'Tolerance',
          type: 'string',
        }),
        defineField({
          name: 'dimensions',
          title: 'Dimensions',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'certifications',
      title: 'Certifications',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'ISO 9001', value: 'ISO 9001' },
          { title: 'AS9100', value: 'AS9100' },
          { title: 'AWS D1.1', value: 'AWS D1.1' },
          { title: 'CE', value: 'CE' },
          { title: 'RoHS', value: 'RoHS' },
        ],
      },
    }),
    defineField({
      name: 'industries',
      title: 'Industries',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Automotive', value: 'automotive' },
          { title: 'Aerospace', value: 'aerospace' },
          { title: 'Energy', value: 'energy' },
          { title: 'Construction', value: 'construction' },
          { title: 'Medical', value: 'medical' },
          { title: 'Electronics', value: 'electronics' },
        ],
      },
    }),
    defineField({
      name: 'features',
      title: 'Key Features',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      initialValue: 'en',
      options: {
        list: [
          { title: 'English', value: 'en' },
          { title: 'Chinese', value: 'zh' },
          { title: 'German', value: 'de' },
        ],
      },
    }),
  ],
  preview: {
    select: {
      title: 'title',
      category: 'category',
      media: 'featuredImage',
    },
    prepare(selection) {
      const { category } = selection;
      return {
        ...selection,
        subtitle: category ? `Category: ${category}` : '',
      };
    },
  },
});
