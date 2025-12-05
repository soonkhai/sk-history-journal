import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    image: z.string().optional(), // YouTube Thumbnail URL
    youtubeId: z.string().optional(), // To embed the player
  }),
});

export const collections = {
  'blog': blogCollection,
};