import { z } from 'zod';

// Schema para validação de foto antes/depois
export const beforeAfterPhotoSchema = z.object({
  title: z
    .string()
    .min(1, 'Título é obrigatório')
    .max(200, 'Título muito longo'),
  description: z
    .string()
    .max(1000, 'Descrição muito longa')
    .optional()
    .nullable(),
  beforeImageUrl: z
    .string()
    .min(1, 'URL da imagem "antes" é obrigatória')
    .url('URL inválida'),
  afterImageUrl: z
    .string()
    .min(1, 'URL da imagem "depois" é obrigatória')
    .url('URL inválida'),
});

export type BeforeAfterPhotoFormData = z.infer<typeof beforeAfterPhotoSchema>;

// Schema para atualização de foto (todos os campos opcionais)
export const updatePhotoSchema = beforeAfterPhotoSchema.partial();

export type UpdatePhotoFormData = z.infer<typeof updatePhotoSchema>;

// Schema para validação de ID
export const photoIdSchema = z.object({
  id: z.string().uuid('ID inválido'),
});
