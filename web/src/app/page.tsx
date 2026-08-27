import type { Metadata } from "next";
import { LandingContent } from "@/components/landing/landing-content";
import { FAQS } from "@/lib/faq-data";

export const metadata: Metadata = {
  title: "Fidya — Master anything. Finish everything.",
  description:
    "Personalized AI curricula engineered around your deadline, taught only from peer-reviewed sources, with every claim verifiably cited. Powered by the SYNTAX multi-agent system.",
  alternates: {
    canonical: "/",
    languages: {
      en: "/?lang=en",
      id: "/?lang=id",
      "x-default": "/",
    },
  },
  openGraph: {
    title: "Fidya — Master anything. Finish everything.",
    description:
      "Online courses have a completion rate under 10%. Fidya fixes that: deadline-driven curricula, peer-reviewed sources only, and every claim verifiably cited.",
    url: "/",
    siteName: "Fidya",
    locale: "en_US",
    alternateLocale: ["id_ID"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fidya — Master anything. Finish everything.",
    description:
      "Deadline-driven AI curricula with 100% grounded citations. Stop collecting courses. Start finishing them.",
  },
};

const SITE_URL = "https://fidya.ai";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Fidya Labs, Inc.",
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Fidya",
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: ["en", "id"],
    },
    {
      "@type": "SoftwareApplication",
      name: "Fidya",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description:
        "Hyper-personalized curricula with 100% grounded citations, powered by the SYNTAX multi-agent system.",
      offers: [
        {
          "@type": "Offer",
          name: "Starter",
          price: "0",
          priceCurrency: "IDR",
        },
        {
          "@type": "Offer",
          name: "Pro Learner",
          price: "149000",
          priceCurrency: "IDR",
        },
        {
          "@type": "Offer",
          name: "Team",
          price: "399000",
          priceCurrency: "IDR",
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQS.en.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
  ],
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingContent />
    </>
  );
}
