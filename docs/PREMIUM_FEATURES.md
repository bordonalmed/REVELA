# Features Premium – Onde integrar na interface

Controle de plano: `userPlan` (`free` | `pro` | `premium`), `hasProAccess`, `hasPremiumAccess`.  
Features Premium devem ser protegidas com `hasPremiumAccess(user)` ou `canUsePremiumFeature(plan, featureId)`.

| Feature | Onde integrar | Arquivo(s) |
|--------|----------------|------------|
| **Timeline de evolução** | Nova aba ou seção na tela do projeto (cronologia antes/depois) | `app/projects/[id]/page.tsx` |
| **Templates profissionais** | Fluxo de novo projeto ou no modal de export (escolha de template) | `app/new-project/page.tsx`, `components/social-media-export-modal.tsx` |
| **Relatório visual em PDF** | Botão "Relatório PDF" junto a Exportar/Publicar na página do projeto | `app/projects/[id]/page.tsx` |
| **Marcações clínicas** | No editor de imagem (além da tarja de privacidade) | `components/image-editor-modal.tsx` |
| **Modo apresentação ao paciente** | Já existe; pode destacar ou restringir para Premium se desejado | `app/projects/[id]/page.tsx` |
| **Captura guiada** | Fluxo de adicionar fotos (novo projeto ou projeto aberto) | `app/new-project/page.tsx` ou componente de câmera/upload |
| **Backup criptografado** | Nova seção em Configurações (ativar/desativar, exportar backup criptografado) | `app/settings/page.tsx` |

## Uso no código

- **Server/utilitários:** `getUserPlan(user)`, `hasProAccess(user)`, `hasPremiumAccess(user)` de `@/lib/plans`.
- **Componentes (client):** `usePlan()` de `@/hooks/usePlan` → `userPlan`, `hasProAccess`, `hasPremiumAccess`, `canUsePremiumFeature(id)`.
- **Feature flags:** `canUsePremiumFeature(plan, 'pdf_report')` etc. IDs em `lib/premium-features.ts` (`PremiumFeatureId`).

Não alterar comportamento do Free nem do Pro; apenas adicionar checagens Premium nas novas funcionalidades.
