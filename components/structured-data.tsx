export function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Revela",
    "url": "https://revela.app",
    "logo": "https://revela.app/revela3.png",
    "description": "Plataforma profissional para comparar fotos antes e depois com privacidade total",
    "sameAs": [] // Adicionar redes sociais quando disponíveis
  };

  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Revela",
    "applicationCategory": "MedicalApplication",
    "operatingSystem": "Web, iOS, Android",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "BRL"
    },
    "description": "Plataforma profissional para comparar fotos antes e depois com privacidade total",
    "url": "https://revela.app"
  };

  const faqPageSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "O que é o Revela?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "O Revela é uma plataforma profissional para comparar fotos antes e depois. Ideal para médicos, dentistas, esteticistas e outros profissionais que precisam documentar e apresentar resultados de transformações."
        }
      },
      {
        "@type": "Question",
        "name": "Como funciona a privacidade no Revela?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Todas as fotos são armazenadas apenas no seu dispositivo, sem uso de nuvem. Isso garante privacidade total e acesso exclusivo para você."
        }
      },
      {
        "@type": "Question",
        "name": "Quanto custa usar o Revela?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "O Revela é gratuito. Você pode criar sua conta e começar a usar imediatamente sem custos."
        }
      },
      {
        "@type": "Question",
        "name": "O Revela funciona em quais dispositivos?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "O Revela funciona em smartphones, tablets e notebooks. É uma aplicação web responsiva que se adapta a qualquer tamanho de tela."
        }
      },
      {
        "@type": "Question",
        "name": "Para quais profissionais o Revela é indicado?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "O Revela é ideal para médicos, dentistas, esteticistas, fisioterapeutas, designers, maquiadores, restauradores e qualquer profissional que precise comparar transformações visuais."
        }
      }
    ]
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "Como Comparar Fotos Antes e Depois com o Revela",
    "description": "Aprenda a usar o Revela para comparar fotos antes e depois de forma profissional",
    "step": [
      {
        "@type": "HowToStep",
        "name": "Faça upload das fotos",
        "text": "Adicione as imagens antes e depois diretamente do seu dispositivo",
        "position": 1
      },
      {
        "@type": "HowToStep",
        "name": "Compare visualmente",
        "text": "Veja as fotos lado a lado ou navegue em um carrossel interativo",
        "position": 2
      },
      {
        "@type": "HowToStep",
        "name": "Apresente resultados",
        "text": "Mostre transformações de forma clara e profissional para seus pacientes",
        "position": 3
      }
    ]
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Revela",
    "url": "https://revela.app",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://revela.app/busca?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
    </>
  );
}

