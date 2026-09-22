export function opportunityJsonLd(opp: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOccupationalProgram',
    name: opp.title,
    description: opp.summary,
    url: opp.canonicalUrl || `https://hocbong.vn/opp/${opp.slug}`,
    provider: {
      '@type': 'CollegeOrUniversity',
      name: opp.organization
    },
    educationalCredentialAwarded: JSON.parse(opp.degreeLevel || '[]').join(', '),
    applicationDeadline: opp.deadline ? opp.deadline.toISOString() : undefined
  };
}

export function searchResultsJsonLd(items: any[], query: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Kết quả tìm kiếm cho: ${query}`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'EducationalOccupationalProgram',
        name: item.title,
        url: `https://hocbong.vn/opp/${item.slug}`
      }
    }))
  };
}

export function breadcrumbJsonLd(items: {name: string, url: string}[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function organizationJsonLd(name: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollegeOrUniversity', // Or Organization
    name: name,
    url: url
  };
}

export function faqJsonLd(faqs: {question: string, answer: string}[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}
