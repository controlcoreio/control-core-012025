import _withMDX from '@next/mdx'
import rehypeSlug from 'rehype-slug'

const withMDX = _withMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [rehypeSlug],
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  output: 'export',
}

export default withMDX(nextConfig)