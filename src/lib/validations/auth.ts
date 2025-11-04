import { z } from 'zod';

// Schema para validação de login
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(100, 'Senha muito longa'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Schema para validação de cadastro
export const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .toLowerCase(),
  password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(100, 'Senha muito longa')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

export type SignupFormData = z.infer<typeof signupSchema>;
