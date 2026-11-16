#!/bin/sh
# Inicialização do contêiner do SpeakUp Eco (Render ou qualquer host Docker).
set -e
cd /var/www/html

# A porta vem do host (Render usa a variável PORT; padrão 10000).
PORT="${PORT:-10000}"
sed -i "s/^Listen .*/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:[0-9]*>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

# O Render gera APP_KEY como base64 puro; o Laravel espera o prefixo "base64:".
if [ -n "$APP_KEY" ] && [ "${APP_KEY#base64:}" = "$APP_KEY" ]; then
    export APP_KEY="base64:${APP_KEY}"
fi
# Endereço público (usado nas URLs das fotos).
export APP_URL="${APP_URL:-$RENDER_EXTERNAL_URL}"

mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs storage/app/public bootstrap/cache
php artisan storage:link --force >/dev/null 2>&1 || true
php artisan migrate --force

# Dados de apresentação: cria uma vez (o seeder é idempotente) e republica as imagens.
if [ "${ECORADAR_SEED_DEMO:-false}" = "true" ]; then
    php artisan db:seed --class=EcoRadarApresentacaoSeeder --force
fi
php artisan ecoradar:fotos-demo

php artisan config:cache
php artisan route:cache
php artisan view:cache
chown -R www-data:www-data storage bootstrap/cache

exec apache2-foreground
