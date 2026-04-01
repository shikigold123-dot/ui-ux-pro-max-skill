export function buildLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['MedicalBusiness', 'LocalBusiness'],
    name: 'Axiom Medical Transfer',
    description:
      'Diskrete medizinische Einzeltransfers für Praxen, Kliniken und Patienten in Düsseldorf und Umgebung.',
    url: 'https://www.axiom-medical-transfer.de',
    telephone: '+492113377 55765',
    email: 'axiom@medicaltransfer.de',
    founder: {
      '@type': 'Person',
      name: 'Saida Taufek',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Rotdornstraße 59',
      addressLocality: 'Düsseldorf',
      postalCode: '40472',
      addressCountry: 'DE',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 51.265,
      longitude: 6.797,
    },
    areaServed: [
      { '@type': 'City', name: 'Düsseldorf' },
      { '@type': 'City', name: 'Meerbusch' },
      { '@type': 'City', name: 'Ratingen' },
      { '@type': 'City', name: 'Neuss' },
      { '@type': 'City', name: 'Köln' },
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '07:00',
        closes: '20:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '08:00',
        closes: '16:00',
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Medizinische Transferleistungen',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Medizinischer Einzeltransfer',
            description:
              'Exklusiver Transfer zum und vom medizinischen Termin — ohne Mitfahrende, diskret und komfortabel.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Praxiskooperation',
            description:
              'Zuverlässige Patientenbegleitung als fester Partner für Praxen und ambulante Einrichtungen.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Klinikkooperation',
            description:
              'Koordinierte Abholung und Rückbegleitung für Kliniken und operative Zentren.',
          },
        },
      ],
    },
    sameAs: [],
  };
}

export function buildWebPageSchema(title: string, url: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    url: url,
    description: description,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Axiom Medical Transfer',
      url: 'https://www.axiom-medical-transfer.de',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Axiom Medical Transfer',
      url: 'https://www.axiom-medical-transfer.de',
    },
  };
}
