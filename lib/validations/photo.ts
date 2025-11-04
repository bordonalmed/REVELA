import { z } from 'zod';

// Schema para criar/atualizar foto antes/depois
export const beforeAfterPhotoSchema = z.object({
  title: z
    .string()
    .min(1, 'Título é obrigatório')
    .max(200, 'Título deve ter no máximo 200 caracteres'),
  description: z
    .string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .optional(),
  beforeImageUrl: z
    .string()
    .url('URL da imagem "antes" inválida')
    .min(1, 'URL da imagem "antes" é obrigatória'),
  afterImageUrl: z
    .string()
    .url('URL da imagem "depois" inválida')
    .min(1, 'URL da imagem "depois" é obrigatória'),
});

export type BeforeAfterPhotoInput = z.infer<typeof beforeAfterPhotoSchema>;

// Schema para atualizar (todos campos opcionais exceto id)
export const updateBeforeAfterPhotoSchema = beforeAfterPhotoSchema.partial().extend({
  id: z.string().uuid('ID inválido'),
});

export type UpdateBeforeAfterPhotoInput = z.infer<typeof updateBeforeAfterPhotoSchema>;
