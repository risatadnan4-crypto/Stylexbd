const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  const baseUrl = "https://stylexbd.vercel.app";
  const currentDate = new Date().toISOString().split("T")[0];

  // Helper to safely escape special XML characters
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

  let productPages = [];
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars — returning static sitemap only");
  } else {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: products, error } = await supabase
        .from('products')
        .select('slug, updated_at')
        .eq('is_published', true);

      if (!error && Array.isArray(products)) {
        productPages = products.map(prod => {
          const slug = prod.slug || '';
          const lastmod = prod.updated_at ? new Date(prod.updated_at).toISOString().split('T')[0] : currentDate;
          return {
            loc: `${baseUrl}/product/${slug}`,
            lastmod,
            priority: "0.8",
            changefreq: "weekly"
          };
        });
      } else if (error) {
        console.error("Supabase sitemap fetch error:", error);
      }
    } catch (e) {
      console.error("Failed to fetch product slugs for sitemap:", e);
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
  res.status(200).send(sitemapXml);
};
