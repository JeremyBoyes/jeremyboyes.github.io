import { getCollection, type CollectionEntry } from 'astro:content';

export const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/\s+/g, '-');

export const formatDate = (value: Date) =>
  value.toLocaleDateString('en-NZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

export async function getPublishedPosts(): Promise<CollectionEntry<'posts'>[]> {
  const posts = await getCollection(
    'posts',
    ({ data }) => !data.draft || !import.meta.env.PROD
  );

  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
