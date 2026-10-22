import { SITE } from "../../config/site";
import { FAQ } from "../../data/content";
import { isPlaceholder } from "../../lib/site-helpers";

export function LocalBusinessSchema() {
  const ready = !isPlaceholder(SITE.COMPANY_NAME) && !isPlaceholder(SITE.COMPANY_PHONE) && !isPlaceholder(SITE.SITE_URL);
  if (!ready) return null;
  const data = {
    "@context": "https://schema.org",
    "@type": "HVACBusiness",
    name: SITE.COMPANY_NAME,
    url: SITE.SITE_URL,
    telephone: SITE.COMPANY_PHONE,
    email: SITE.COMPANY_EMAIL || undefined,
    address: { "@type": "PostalAddress", streetAddress: SITE.COMPANY_ADDRESS || undefined, addressLocality: SITE.COMPANY_CITY, addressRegion: SITE.COMPANY_STATE, addressCountry: "BR" },
    legalName: SITE.COMPANY_LEGAL_NAME,
    taxID: SITE.COMPANY_DOCUMENT,
    image: SITE.SITE_URL.replace(/\/$/, "") + "/images/hero.webp",
    logo: SITE.SITE_URL.replace(/\/$/, "") + "/logo-intercool.svg",
    openingHours: "Mo-Fr 08:25-17:30",
    areaServed: SITE.SERVICE_AREAS.length ? SITE.SERVICE_AREAS : SITE.COMPANY_REGION,
    sameAs: [SITE.INSTAGRAM_URL, SITE.FACEBOOK_URL, SITE.LINKEDIN_URL].filter(Boolean),
    hasMap: SITE.GOOGLE_MAPS_URL || undefined,
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.filter((f) => !/^\[.*\]$/.test(f.answer)).map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
    </>
  );
}
