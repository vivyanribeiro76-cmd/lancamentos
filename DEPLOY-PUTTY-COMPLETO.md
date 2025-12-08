# 🚀 DEPLOY COMPLETO - VPS HETZNER via PuTTY

## ✅ Informações do Deploy

- **IP VPS:** 5.161.180.119
- **Gestor:** lancamentos.fzia.store
- **Admin:** admin.lancamentos.fzia.store
- **GitHub:** https://github.com/vivyanribeiro76-cmd/lancamentos

---

## 📋 PASSO 1: Configurar DNS na GoDaddy

**Você já criou:**
- ✅ lancamentos.fzia.store → 5.161.180.119

**Crie agora:**
1. Acesse: https://dcc.godaddy.com/control/portfolio/
2. Clique em **fzia.store**
3. Vá em **DNS**
4. Clique em **Adicionar**
5. Configure:
   - **Tipo:** A
   - **Nome:** `admin.lancamentos`
   - **Valor:** `5.161.180.119`
   - **TTL:** 600
6. **Salve**

---

## 🖥️ PASSO 2: Conectar no PuTTY

1. Abra o **PuTTY**
2. **Host Name:** `5.161.180.119`
3. **Port:** `22`
4. Clique em **Open**
5. Login: `root` (ou seu usuário)
6. Digite sua senha

---

## 📦 PASSO 3: Instalar Node.js 18

**Cole cada comando e pressione Enter:**

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
```

```bash
sudo apt-get install -y nodejs
```

```bash
node -v
```

*(Deve mostrar v18.x.x)*

---

## 🔧 PASSO 4: Instalar PM2

```bash
npm install -g pm2
```

---

## 🌐 PASSO 5: Instalar Nginx

```bash
sudo apt update
```

```bash
sudo apt install nginx -y
```

```bash
sudo systemctl start nginx
```

```bash
sudo systemctl enable nginx
```

---

## 📁 PASSO 6: Clonar Projeto do GitHub

```bash
cd /var/www
```

```bash
git clone https://github.com/vivyanribeiro76-cmd/lancamentos.git
```

```bash
cd lancamentos
```

---

## 🔐 PASSO 7: Configurar Variáveis de Ambiente

```bash
nano .env.production
```

**Cole este conteúdo (ajuste com suas chaves do Supabase):**

```
NEXT_PUBLIC_SUPABASE_URL=https://aopbzryufcpsawaweico.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_AQUI
SUPABASE_SERVICE_ROLE_KEY=SUA_CHAVE_SERVICE_ROLE_AQUI
```

**Para salvar:**
- Pressione `Ctrl + X`
- Pressione `Y`
- Pressione `Enter`

---

## 📦 PASSO 8: Instalar Dependências e Buildar

```bash
npm install
```

*(Aguarde... pode demorar 2-3 minutos)*

```bash
npm run build
```

*(Aguarde... pode demorar 1-2 minutos)*

---

## 🚀 PASSO 9: Iniciar com PM2

```bash
pm2 start npm --name "lancamentos" -- start
```

```bash
pm2 save
```

```bash
pm2 startup
```

**IMPORTANTE:** Copie e execute o comando que aparecer (algo como `sudo env PATH=...`)

---

## 🌐 PASSO 10: Configurar Nginx - GESTOR

```bash
sudo nano /etc/nginx/sites-available/lancamentos-gestor
```

**Cole este conteúdo:**

```nginx
server {
    listen 80;
    server_name lancamentos.fzia.store;

    location / {
        proxy_pass http://localhost:3000/gestor;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Salvar:** `Ctrl + X`, `Y`, `Enter`

---

## 🌐 PASSO 11: Configurar Nginx - ADMIN

```bash
sudo nano /etc/nginx/sites-available/lancamentos-admin
```

**Cole este conteúdo:**

```nginx
server {
    listen 80;
    server_name admin.lancamentos.fzia.store;

    location / {
        proxy_pass http://localhost:3000/admin;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Salvar:** `Ctrl + X`, `Y`, `Enter`

---

## ✅ PASSO 12: Ativar Sites no Nginx

```bash
sudo ln -s /etc/nginx/sites-available/lancamentos-gestor /etc/nginx/sites-enabled/
```

```bash
sudo ln -s /etc/nginx/sites-available/lancamentos-admin /etc/nginx/sites-enabled/
```

```bash
sudo nginx -t
```

*(Deve mostrar "syntax is ok" e "test is successful")*

```bash
sudo systemctl reload nginx
```

---

## 🔒 PASSO 13: Instalar SSL (HTTPS)

```bash
sudo apt install certbot python3-certbot-nginx -y
```

```bash
sudo certbot --nginx -d lancamentos.fzia.store -d admin.lancamentos.fzia.store
```

**Digite:**
- Seu email
- `Y` para aceitar termos
- `Y` ou `N` para compartilhar email (opcional)

---

## 🎉 PRONTO!

**Acesse:**
- **Gestor:** https://lancamentos.fzia.store/gestor/login
- **Admin:** https://admin.lancamentos.fzia.store/admin/login

**Credenciais:**
- Gestor: fbapaes@gmail.com / imob@123
- Admin: imobadmin@fzia.com / imob@123

---

## 🔧 Comandos Úteis

**Ver logs:**
```bash
pm2 logs lancamentos
```

**Reiniciar:**
```bash
pm2 restart lancamentos
```

**Atualizar projeto:**
```bash
cd /var/www/lancamentos
git pull
npm install
npm run build
pm2 restart lancamentos
```

---

## ❓ Problemas?

**Aplicação não inicia:**
```bash
pm2 logs lancamentos
```

**Nginx erro:**
```bash
sudo nginx -t
sudo systemctl status nginx
```

**Porta 3000 ocupada:**
```bash
sudo lsof -i :3000
pm2 list
```
