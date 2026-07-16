import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { renderCoverSvg } from '../../lib/cover';

export const getStaticPaths: GetStaticPaths = async () => {
  const projects = await getCollection('projects', (entry) => !entry.data.cover);
  return projects.map((project) => ({
    params: { slug: project.id }
  }));
};

export const GET: APIRoute = ({ params }) => {
  // Artwork is seeded purely by slug (deterministic abstract gradient — no
  // text; the card body already carries title/metrics). Same seed for both
  // locales would render identical art, which is desirable.
  const svg = renderCoverSvg({ seed: params.slug! });
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' }
  });
};
