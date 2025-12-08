# Script automático para subir projeto no GitHub
# Clique duas vezes neste arquivo para executar

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SUBIR PROJETO NO GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Pedir informações
$email = Read-Host "Digite seu EMAIL do GitHub"
$nome = Read-Host "Digite seu NOME DE USUARIO do GitHub"
$repoUrl = Read-Host "Cole o LINK do repositório (ex: https://github.com/usuario/dashboard-upload-app.git)"

Write-Host "`nConfigurando Git..." -ForegroundColor Yellow
git config --global user.email "$email"
git config --global user.name "$nome"

Write-Host "Adicionando arquivos..." -ForegroundColor Yellow
git add .

Write-Host "Fazendo commit..." -ForegroundColor Yellow
git commit -m "Dashboard Upload - Admin e Gestor completo"

Write-Host "Conectando ao GitHub..." -ForegroundColor Yellow
git remote add origin $repoUrl

Write-Host "Enviando para GitHub..." -ForegroundColor Yellow
git branch -M main
git push -u origin main

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  PROJETO ENVIADO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Pressione qualquer tecla para fechar..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
