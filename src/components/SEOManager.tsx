import React, { useEffect } from 'react';
import { Product } from '../types';

interface SEOManagerProps {
  products: Product[];
  selectedProduct: Product | null;
  currentPath: string;
}

export default function SEOManager({ products, selectedProduct, currentPath }: SEOManagerProps) {
  useEffect(() => {
    // 1. Determine keywords to use
    let keywordsString = '';

    if (selectedProduct) {
      // If a product is selected, prioritize its specific keywords
      keywordsString = selectedProduct.seo_keywords || selectedProduct.seoKeywords || selectedProduct.metaKeywords || '';
    }

    // If no specific product keywords are found, aggregate from all products
    if (!keywordsString.trim() && products.length > 0) {
      const allKeywordsSet = new Set<string>();
      
      // Add default brand keywords
      const defaultKeywords = ["stylex", "style x", "style x bd", "stylex bd", "style x bangladesh", "stylex clothing", "stylex online shopping"];
      defaultKeywords.forEach(k => allKeywordsSet.add(k.trim()));

      products.forEach(p => {
        const pKeywords = p.seo_keywords || p.seoKeywords || p.metaKeywords || '';
        if (pKeywords) {
          pKeywords.split(',').forEach(k => {
            const trimmed = k.trim();
            if (trimmed) {
              allKeywordsSet.add(trimmed.toLowerCase());
            }
          });
        }
        // Also add product titles as keywords fallback
        if (p.title) {
          allKeywordsSet.add(p.title.toLowerCase().trim());
          allKeywordsSet.add(`stylex ${p.title.toLowerCase().trim()}`);
        }
      });

      keywordsString = Array.from(allKeywordsSet).join(', ');
    }

    if (!keywordsString.trim()) {
      keywordsString = "stylex, style x, style x bd, stylex bd, style x bangladesh, stylex clothing, stylex online shopping, premium luxury bd";
    }

    // 2. Helper to set/update meta tag
    const updateMetaTag = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('name', name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    const updateOgMetaTag = (property: string, content: string) => {
      let element = document.querySelector(`meta[property="${property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 3. Update Keywords tags
    updateMetaTag('keywords', keywordsString);
    updateMetaTag('news_keywords', keywordsString);

    // 4. Optionally update Title, Description & OpenGraph if product is selected
    if (selectedProduct) {
      const titleVal = selectedProduct.seoTitle || `${selectedProduct.title} | STYLE X BD`;
      const descVal = selectedProduct.seoDescription || selectedProduct.description || 'Authentic Premium Quality Premium Garments from STYLE X.';
      
      document.title = titleVal;
      updateMetaTag('description', descVal);
      updateOgMetaTag('og:title', selectedProduct.ogTitle || titleVal);
      updateOgMetaTag('og:description', selectedProduct.ogDescription || descVal);
      if (selectedProduct.imageUrl || selectedProduct.ogImage) {
        updateOgMetaTag('og:image', selectedProduct.ogImage || selectedProduct.imageUrl);
      }
    } else {
      // Reset title and desc if on general paths
      if (currentPath === '/wishlist') {
        document.title = 'My Wishlist | STYLE X';
        updateMetaTag('description', 'View your curated private luxury collection wishlist on STYLE X.');
      } else if (currentPath.startsWith('/track')) {
        document.title = 'Order Tracking Concierge | STYLE X';
        updateMetaTag('description', 'Track your exclusive STYLE X order status securely in real-time.');
      } else {
        // Default home state
        document.title = 'STYLE X | Elite Luxury Fashion Showcase';
        updateMetaTag('description', 'Discover elite luxury fashion garments curated by STYLE X Bangladesh. Nationwide secure cash on delivery.');
      }
    }

    // 5. Track GA4 SPA page_view if gtag is available on window
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: currentPath || window.location.pathname,
        send_to: 'G-F523XY9WL5'
      });
    }
  }, [products, selectedProduct, currentPath]);

  return null; // Work entirely via side-effects
}
