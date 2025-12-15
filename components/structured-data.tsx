export function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Revela",
    "url": "https://revela.app",
    "logo": "https://revela.app/revela3.png",
    "description": "Plataforma profissional para visualização de fotos antes e depois",
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
    </>
  );
}

