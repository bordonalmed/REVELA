# Integração com Google Analytics

## Configuração

### 1. Obter o Measurement ID do Google Analytics

1. Acesse o [Google Analytics](https://analytics.google.com/)
2. Crie uma propriedade ou selecione uma existente
3. Vá em **Administrador** > **Fluxos de dados** > **Adicionar fluxo de dados** > **Web**
4. Copie o **Measurement ID** (formato: `G-XXXXXXXXXX`)

### 2. Configurar Variável de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Importante**: Substitua `G-XXXXXXXXXX` pelo seu Measurement ID real.

### 3. Reiniciar o Servidor

Após adicionar a variável de ambiente, reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

## Eventos Rastreados

O sistema rastreia automaticamente os seguintes eventos:

### Autenticação
- `login` - Quando o usuário faz login
- `logout` - Quando o usuário faz logout
- `sign_up` - Quando o usuário cria uma conta

### Projetos
- `create_project` - Quando um projeto é criado
- `view_project` - Quando um projeto é visualizado
- `update_project` - Quando um projeto é atualizado
- `delete_project` - Quando um projeto é deletado

### Edição de Imagens
- `edit_image` - Quando uma imagem é editada (crop, zoom, rotação)

### Exportação
- `export_image` - Quando uma imagem é exportada
- `export_project` - Quando um projeto completo é exportado
- `export_backup` - Quando um backup é exportado
- `import_backup` - Quando um backup é importado

### Modos de Visualização
- `enter_presentation_mode` - Quando entra no modo apresentação
- `enter_slider_mode` - Quando entra no modo slider

### Outros
- `save_notes` - Quando notas são salvas
- `create_folder` - Quando uma pasta é criada
- `update_folder` - Quando uma pasta é atualizada
- `delete_folder` - Quando uma pasta é deletada
- `change_password` - Quando a senha é alterada
- `share` - Quando compartilha nas redes sociais

## Parâmetros dos Eventos

Cada evento inclui informações relevantes:

- **Projetos**: `project_id`, `project_name`, contagem de imagens
- **Imagens**: `image_type` (before/after), `image_index`, `edit_type`
- **Exportação**: `export_format`, `export_layout`
- **Compartilhamento**: `share_platform`

## Visualização no Google Analytics

1. Acesse o Google Analytics
2. Vá em **Relatórios** > **Engajamento** > **Eventos**
3. Você verá todos os eventos rastreados com seus parâmetros

## Desabilitar Tracking (Desenvolvimento)

Se precisar desabilitar o tracking durante desenvolvimento, basta não definir a variável `NEXT_PUBLIC_GA_MEASUREMENT_ID` ou deixá-la vazia. O sistema detectará automaticamente e não enviará eventos.

## Privacidade

O Google Analytics é configurado para respeitar a privacidade dos usuários. Nenhuma informação pessoal identificável (PII) é enviada. Apenas eventos e métricas de uso são rastreados.

