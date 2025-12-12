# 🔄 ATUALIZAR PROJETO NA VPS

## Comandos para executar no PuTTY

**1. Conectar no PuTTY:**
- Host: 5.161.180.119
- Login como root

**2. Ir para a pasta do projeto:**
```bash
cd /var/www/lancamentos
```

**3. Puxar atualizações do GitHub:**
```bash
git pull origin main
```

**4. Instalar novas dependências (se houver):**
```bash
npm install
```

**5. Fazer novo build:**
```bash
npm run build
```

**6. Reiniciar aplicação:**
```bash
pm2 restart lancamentos
```

**7. Verificar se está rodando:**
```bash
pm2 status
```

---

## ✅ PRONTO!

Acesse os sites para testar:
- Gestor: https://lancamentos.fzia.store/gestor/login
- Admin: https://admin.lancamentos.fzia.store/admin/login

---

## 🔧 Se der erro

**Ver logs:**
```bash
pm2 logs lancamentos --lines 50
```

**Reiniciar completamente:**
```bash
pm2 delete lancamentos
pm2 start npm --name "lancamentos" -- start
pm2 save
```
