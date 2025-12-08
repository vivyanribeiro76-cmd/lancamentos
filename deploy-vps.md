# Deploy Dashboard Upload - VPS Hetzner

## Pré-requisitos na VPS

- Node.js 18+ instalado
- PM2 para gerenciar processos
- Nginx como proxy reverso
- Domínio apontando para o IP da VPS

---

## 1. Preparar o projeto localmente

```powershell
# No Windows, na pasta do projeto
cd C:\Users\adm\CascadeProjects\dashboard-upload-app

# Criar arquivo .env.production
# (copie o conteúdo abaixo e salve como .env.production)
```

**Conteúdo do `.env.production`:**
```
NEXT_PUBLIC_SUPABASE_URL=https://aopbzryufcpsawaweico.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key_aqui
```

---

## 2. Commit e Push para GitHub

```powershell
git add .
git commit -m "Dashboard completo - pronto para deploy"
git push origin main
```

---

## 3. Configurar na VPS

**SSH na VPS:**
```bash
ssh root@SEU_IP_VPS
```

**Instalar dependências (se necessário):**
```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2
npm install -g pm2

# Nginx
sudo apt update
sudo apt install nginx -y
```

**Clonar o projeto:**
```bash
cd /var/www
git clone https://github.com/SEU_USUARIO/dashboard-upload-app.git
cd dashboard-upload-app
```

**Configurar variáveis de ambiente:**
```bash
nano .env.production
# Cole as variáveis do Supabase
# Ctrl+X, Y, Enter para salvar
```

**Instalar dependências e buildar:**
```bash
npm install
npm run build
```

**Iniciar com PM2:**
```bash
pm2 start npm --name "dashboard-upload" -- start
pm2 save
pm2 startup
```

---

## 4. Configurar Nginx

**Criar configuração:**
```bash
sudo nano /etc/nginx/sites-available/dashboard-upload
```

**Cole este conteúdo (ajuste o domínio):**
```nginx
server {
    listen 80;
    server_name dashboard.seudominio.com;

    location / {
        proxy_pass http://localhost:3000;
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

**Ativar o site:**
```bash
sudo ln -s /etc/nginx/sites-available/dashboard-upload /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. Configurar SSL (Certbot)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d dashboard.seudominio.com
```

---

## 6. Acessar

- **HTTP:** http://dashboard.seudominio.com
- **HTTPS:** https://dashboard.seudominio.com

**URLs:**
- Admin: https://dashboard.seudominio.com/admin/login
- Gestor: https://dashboard.seudominio.com/gestor/login

---

## Atualizar o projeto (futuras mudanças)

```bash
cd /var/www/dashboard-upload-app
git pull
npm install
npm run build
pm2 restart dashboard-upload
```

---

## Comandos úteis PM2

```bash
pm2 status              # Ver status
pm2 logs dashboard-upload  # Ver logs
pm2 restart dashboard-upload  # Reiniciar
pm2 stop dashboard-upload     # Parar
```
