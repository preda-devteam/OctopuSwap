import React from 'react'
import { GetServerSideProps } from 'next'
import * as fs from 'fs'
import path from 'path'

const Sitemap = () => {
  return null
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const staticPaths: string[] = []
  const getPath = (p: string, prev?: string) => {
    fs.readdirSync(p)
      .filter(staticPage => {
        return !['_app.tsx', '_error.tsx', '_document.tsx', '404.tsx', 'sitemap.xml.tsx'].includes(staticPage)
      })
      .forEach(url => {
        const nextPath = path.resolve(p, url)
        const isDir = fs.lstatSync(nextPath).isDirectory()
        if (isDir) {
          getPath(nextPath, url)
        } else {
          staticPaths.push(process.env.SITEMAP + (prev ? `${prev}/` : '') + url.replace('.tsx', ''))
        }
      })
  }

  getPath(path.resolve('src', 'pages'))

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${staticPaths
      .map(url => {
        return `
          <url>
            <loc>${url}</loc>
            <lastmod>${new Date().toISOString()}</lastmod>
          </url>
        `
      })
      .join('')}
  </urlset>
`

  res.setHeader('Content-Type', 'text/xml')
  res.write(sitemap)
  res.end()

  return {
    props: {},
  }
}

export default Sitemap
