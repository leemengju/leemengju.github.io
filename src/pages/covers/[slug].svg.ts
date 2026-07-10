import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { renderCoverSvg } from '../../lib/cover';

export const getStaticPaths: GetStaticPaths = async () => {
  const projects = await getCollection('projects', (entry) => !entry.data.cover);
  return projects.map((project) => ({
    params: { slug: project.id },
    props: { project }
  }));
};

export const GET: APIRoute = ({ props }) => {
  const project = props.project as Awaited<ReturnType<typeof getCollection<'projects'>>>[number];
  const svg = renderCoverSvg({
    title: project.data.title,
    metric: project.data.metrics,
    tags: project.data.tags
  });
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' }
  });
};
