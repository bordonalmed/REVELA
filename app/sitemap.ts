import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://revela.app';
  const currentDate = new Date().toISOString();

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // Adicionar mais URLs conforme páginas forem criadas
    // Exemplo para futuras páginas:
    // {
    //   url: `${baseUrl}/para-medicos`,
    //   lastModified: currentDate,
    //   changeFrequency: 'monthly',
    //   priority: 0.8,
    // },
    // {
    //   url: `${baseUrl}/faq`,
    //   lastModified: currentDate,
    //   changeFrequency: 'monthly',
    //   priority: 0.7,
    // },
  ];
}

