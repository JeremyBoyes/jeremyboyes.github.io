import rss from '@astrojs/rss';
import { getPublishedPosts } from '../lib/content';

export async function GET(context) {
  const posts = await getPublishedPosts();

  return rss({
    title: 'Jeremy Boyes',
    description: 'Application Packaging & Deployment | Intune | SCCM | PowerShell',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/posts/${post.id}/`,
      categories: post.data.categories,
      author: post.data.author,
    })),
  });
}
