// Estrutura de mock data para desenvolvimento
// Este arquivo pode ser usado quando não houver conexão com Supabase

export interface MockBeforeAfterPhoto {
  id: string;
  userId: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Exemplo de dados mockados
export const mockPhotos: MockBeforeAfterPhoto[] = [
  {
    id: '1',
    userId: 'mock-user-1',
    beforeImageUrl: '/placeholder-before.jpg',
    afterImageUrl: '/placeholder-after.jpg',
    title: 'Tratamento de Estética',
    description: 'Resultado após 3 meses de tratamento',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Simular delay de rede
export const simulateDelay = (ms: number = 1000): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// Função para buscar fotos mockadas
export async function getMockPhotos(userId: string): Promise<MockBeforeAfterPhoto[]> {
  await simulateDelay(500);
  return mockPhotos.filter(photo => photo.userId === userId);
}

// Função para buscar uma foto específica
export async function getMockPhoto(id: string): Promise<MockBeforeAfterPhoto | undefined> {
  await simulateDelay(300);
  return mockPhotos.find(photo => photo.id === id);
}
