## Objetivo

Permitir que usuários (incluindo `equipemarcoroza@gmail.com`) redefinam a própria senha por e-mail, e remover a opção de cadastro público da tela de login.

## Mudanças

### 1. Tela de Login (`src/pages/Login.tsx`)
- Remover as `Tabs` de "Entrar / Cadastrar" — deixar apenas o formulário de login.
- Remover o handler `handleSignup`, o estado `displayName` e a aba de cadastro.
- Adicionar um link discreto **"Esqueci minha senha"** abaixo do campo de senha.
- Ao clicar, abre um pequeno diálogo (ou alterna para um mini-formulário) pedindo o e-mail e dispara:
  ```
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  })
  ```
- Mostrar toast de sucesso: "Enviamos um e-mail com instruções para redefinir sua senha."

### 2. Nova página `src/pages/ResetPassword.tsx`
- Rota pública `/reset-password` (não protegida).
- Quando o usuário clica no link do e-mail, o Supabase cria automaticamente uma sessão temporária do tipo `recovery`.
- A página exibe formulário com **Nova senha** + **Confirmar nova senha** (mínimo 6 caracteres).
- Ao submeter chama `supabase.auth.updateUser({ password })`.
- Em caso de sucesso: toast + redirect para `/dashboard`.
- Caso o usuário acesse a rota sem sessão de recovery, mostra mensagem "Link inválido ou expirado".

### 3. Roteamento (`src/App.tsx`)
- Adicionar `<Route path="/reset-password" element={<ResetPassword />} />` como rota pública (fora do `ProtectedRoute`).

### 4. Bloquear novos cadastros
- Desabilitar signups no backend (`disable_signup: true`) para que ninguém consiga criar conta nova mesmo via API direta. Apenas o admin atual e quaisquer contas já existentes continuam funcionando.

## Sobre o e-mail enviado

O Supabase já envia um e-mail padrão de recuperação automaticamente — não precisamos configurar domínio próprio nem templates customizados para isso funcionar agora. O usuário `equipemarcoroza@gmail.com` receberá o link de reset assim que solicitar.

Se mais tarde quiser personalizar o template do e-mail (logo da Equipe Marco Roza, cores da marca etc.), posso configurar um domínio de envio e templates customizados em uma etapa separada.

## Resumo do que muda para o usuário final

- Tela de login só tem "Entrar" + link "Esqueci minha senha".
- Ninguém consegue mais criar conta pela tela pública.
- Qualquer usuário existente pode redefinir a própria senha pelo e-mail.