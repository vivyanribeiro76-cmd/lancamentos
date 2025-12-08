# Script para commit e push antes do deploy

Write-Host "=== Preparando para Deploy ===" -ForegroundColor Green

# Verificar se há mudanças
git status

Write-Host "`nAdicionando arquivos..." -ForegroundColor Yellow
git add .

Write-Host "`nCommit..." -ForegroundColor Yellow
git commit -m "Dashboard Upload completo - Admin e Gestor funcionando"

Write-Host "`nPush para GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host "`n=== Pronto para deploy na VPS! ===" -ForegroundColor Green
Write-Host "Agora siga as instruções em deploy-vps.md" -ForegroundColor Cyan
