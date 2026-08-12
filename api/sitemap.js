const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.query && req.query.type === 'robots') {
    const robots = `User-agent: *
Allow: /
Allow: /product/
Allow: /products/
Allow: /category/
Allow: /search
Allow: /sitemap.xml
Allow: /api/sitemap
Disallow: /admin
Disallow: /xxxrisatxxx
Disallow: /wishlist
Disallow: /cart
Disallow: /checkout
Disallow: /profile
Disallow: /orders
Disallow: /auth
Disallow: /track

# Host & XML Sitemap Reference
Host: https://stylexbd.vercel.app
Sitemap: https://stylexbd.vercel.app/sitemap.xml`;

    res.setHeader("Content-Type", "text/plain");
    return res.status(200).send(robots);
  }

  const baseUrl = "https://stylexbd.vercel.app";
  const currentDate = new Date().toISOString().split("T")[0];

  const escapeXml = (str) => {
    return (str || '').replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  const staticPages = [
    { loc: `${baseUrl}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${baseUrl}/category/men`, priority: "0.9", changefreq: "weekly" },
    { loc: `${baseUrl}/category/women`, priority: "0.9", changefreq: "weekly" },
    { loc: `${baseUrl}/category/unisex`, priority: "0.9", changefreq: "weekly" },
    { loc: `${baseUrl}/category/accessories`, priority: "0.9", changefreq: "weekly" },
    { loc: `${baseUrl}/about`, priority: "0.6", changefreq: "monthly" },
    { loc: `${baseUrl}/faq`, priority: "0.6", changefreq: "monthly" },
    { loc: `${baseUrl}/delivery`, priority: "0.5", changefreq: "monthly" },
    { loc: `${baseUrl}/returns`, priority: "0.5", changefreq: "monthly" },
    { loc: `${baseUrl}/contact`, priority: "0.5", changefreq: "monthly" }
  ];

  try {
    let productPages = [];
    const addedSlugs = new Set();
    const addProductSlug = (slug, lastmod = currentDate) => {
      if (!slug || addedSlugs.has(slug)) return;
      addedSlugs.add(slug);
      productPages.push(
        { loc: `${baseUrl}/products/${slug}`, lastmod, priority: "0.8", changefreq: "weekly" },
        { loc: `${baseUrl}/product/${slug}`, lastmod, priority: "0.8", changefreq: "weekly" }
      );
    };

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: products, error } = await supabase
          .from('products')
          .select('title, seoSlug, code, slug, updated_at')
          .eq('is_published', true);

        if (!error && Array.isArray(products)) {
          products.forEach(prod => {
            const slug = prod.seoSlug || prod.slug || (prod.title || '')
              .toLowerCase()
              .trim()
              .replace(/\s+/g, '-')
              .replace(/[^\w\-]+/g, '')
              .replace(/\-\-+/g, '-')
              .replace(/^-+/, '')
              .replace(/-+$/, '') || prod.code;
            const lastmod = prod.updated_at
              ? new Date(prod.updated_at).toISOString().split('T')[0]
              : currentDate;
            if (slug) addProductSlug(slug, lastmod);
          });
        }
      } catch (innerError) {
        console.error("Failed to fetch product slugs:", innerError);
      }
    }

    const allPages = [
      ...staticPages.map(p => ({ ...p, lastmod: currentDate })),
      ...productPages
    ];

    const xmlEntries = allPages.map(page => `  <url>
    <loc>${escapeXml(page.loc)}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join("\n");

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).send(sitemapXml);

  } catch (globalError) {
    console.error("Global sitemap handler exception:", globalError);
    // Fallback always returns the static sitemap to prevent a blank page
    const fallbackEntries = staticPages.map(page => `  <url>
    <loc>${escapeXml(page.loc)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join("\n");

    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${fallbackEntries}
</urlset>`;

    try {
      res.setHeader("Content-Type", "application/xml");
      res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
      return res.status(200).send(fallbackXml);
    } catch (sendError) {
      console.error("Failed to send fallback response:", sendError);
    }
  }
};
