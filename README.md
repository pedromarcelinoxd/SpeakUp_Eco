# EcoRadar

**Identifique. Denuncie. Transforme.** Plataforma colaborativa de monitoramento ambiental (UPX · Engenharia da Computação · FACENS).

## Arquitetura

```
 App mobile (Expo / React Native)          Painel web (Blade + Alpine, /app)
        │  token Sanctum                          │  token Sanctum
        └──────────────► API Laravel (/api) ◄─────┘
                          regras de negócio, permissões, pontuação,
                          notificações (banco + push Expo)
                                   │
                              Banco de dados (único)
```

- **Um backend, dois clientes.** App e painel usam os mesmos endpoints, validações (`StoreDenunciaRequest`), permissões (`DenunciaPolicy`) e regras de pontuação (`App\Support\Pontuacao`).
- **Permissões.** Qualquer usuário cria denúncias e confirma as de outras pessoas. O autor só pode excluir a própria denúncia enquanto ela está pendente. **Administradores** moderam o status e editam ou removem ecopontos.
- **Notificações.** Ficam gravadas no banco (lidas pelo app e pelo painel) e são enviadas por push ao celular do autor.

## Executar o backend e o painel web

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
php artisan storage:link
npm run build        # ou: npm run dev
php artisan serve --host=0.0.0.0 --port=8000
```

- Painel: **http://localhost:8000/app**. A rota `/` continua retornando o status JSON da API.
- Tornar um usuário administrador (moderação no painel):

  ```bash
  php artisan ecoradar:admin email@exemplo.com
  ```

- Pontos de descarte de demonstração (opcional, identificados como "(demonstração)"):

  ```bash
  php artisan db:seed --class=EcoRadarDemoSeeder
  ```

## Executar o app mobile

Veja [mobile/README.md](mobile/README.md). Resumo:

```bash
cd mobile
npm install
npx expo start
```

Abra no **Expo Go** (Android/iOS) na mesma rede Wi-Fi do computador.

## API (`/api`)

| Método | Rota | Acesso |
| --- | --- | --- |
| POST | `/register`, `/login` | público |
| GET | `/ecopontos`, `/ecopontos/{id}`, `/ranking?periodo=semanal\|mensal\|geral` | público |
| GET | `/user`, `/perfil/resumo` | logado |
| GET / POST | `/denuncias` (filtros `status`, `categoria`, `minhas`) | logado |
| GET | `/denuncias/{id}` (com histórico) | logado |
| POST | `/denuncias/{id}/confirmar` | logado, exceto o autor |
| PATCH | `/denuncias/{id}/status` | administrador |
| DELETE | `/denuncias/{id}` | autor (pendente) ou administrador |
| GET / POST | `/notificacoes`, `/notificacoes/{id}/lida`, `/notificacoes/lidas` | logado |
| POST / DELETE | `/push-tokens` | logado |
| POST / PUT / DELETE | `/ecopontos` | logado / administrador |

`POST /denuncias` aceita o formato novo (`latitude`, `longitude`, `categoria`, `titulo`, `descricao`, `foto` + `fotos[]`) e o formato original do campus (`ponto_referencia`).

## Testes

```bash
php artisan test --filter=EcoRadar
```

Cobre a integração app ⇄ painel, as permissões, as confirmações, o ranking, as notificações/push e todas as páginas do painel.

## Interface web (`/app`)

| Página | Rota |
| --- | --- |
| Visão geral | `/app` |
| Mapa ambiental | `/app/mapa` |
| Denúncias / nova / detalhes | `/app/denuncias`, `/app/denuncias/nova`, `/app/denuncias/{id}` |
| Pontos de descarte / detalhes | `/app/descarte`, `/app/descarte/{id}` |
| Ranking | `/app/ranking` |
| Panorama ambiental | `/app/panorama` |
| Perfil, notificações, configurações | `/app/perfil`, `/app/notificacoes`, `/app/configuracoes` |
| Entrar / criar conta | `/app/entrar` |

Stack: Laravel 12 + Blade, Alpine.js, Tailwind CSS 3, Vite, Leaflet (OpenStreetMap/Esri, sem chave), Chart.js e Lucide.

- Código do front: `resources/js/ecoradar/` (store, API, mapas, componentes) e `resources/views/ecoradar/` + `resources/views/components/eco/`.
- Integração com a API existente: `resources/js/ecoradar/services/api.js` (login, cadastro, perfil, ecopontos, denúncias).
- **Dados demonstrativos**: `resources/js/ecoradar/data/demo.js`. São identificados com o selo “Demonstração” e podem ser desativados em Configurações.

---

<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework. You can also check out [Laravel Learn](https://laravel.com/learn), where you will be guided through building a modern Laravel application.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

- **[Vehikl](https://vehikl.com)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel)**
- **[DevSquad](https://devsquad.com/hire-laravel-developers)**
- **[Redberry](https://redberry.international/laravel-development)**
- **[Active Logic](https://activelogic.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
