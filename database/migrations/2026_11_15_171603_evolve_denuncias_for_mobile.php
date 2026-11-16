<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Evolui denúncias e ecopontos para o app mobile e o painel web.
 *
 * Mudanças ADITIVAS e não destrutivas:
 *  - novos campos opcionais (geolocalização, categoria, título, descrição, fotos extras);
 *  - `ponto_referencia` passa a ser opcional (o GPS substitui os prédios do campus,
 *    mas os registros antigos continuam válidos);
 *  - `status` vira string para aceitar "verificada" e "nao_confirmada"
 *    (os valores antigos pendente/em_analise/resolvida são preservados).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('denuncias', function (Blueprint $table) {
            $table->string('categoria', 40)->default('outros')->after('user_id');
            $table->string('titulo', 120)->nullable()->after('categoria');
            $table->text('descricao')->nullable()->after('titulo');
            $table->decimal('latitude', 10, 7)->nullable()->after('descricao');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->string('endereco')->nullable()->after('longitude');
            $table->json('fotos_extras')->nullable()->after('foto_path');
            $table->string('origem', 10)->default('web')->after('criticidade');
        });

        Schema::table('denuncias', function (Blueprint $table) {
            $table->string('ponto_referencia')->nullable()->change();
            $table->string('status', 20)->default('pendente')->change();
            $table->index(['status', 'created_at']);
        });

        Schema::table('ecopontos', function (Blueprint $table) {
            $table->string('categoria', 40)->default('ecoponto')->after('nome');
            $table->decimal('latitude', 10, 7)->nullable()->after('descricao_local');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->string('endereco')->nullable()->after('longitude');
            $table->string('horario')->nullable()->after('endereco');
        });

        Schema::table('ecopontos', function (Blueprint $table) {
            $table->string('ponto_referencia')->nullable()->change();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_admin')->default(false)->after('foto_perfil_path');
        });
    }

    public function down(): void
    {
        Schema::table('denuncias', function (Blueprint $table) {
            $table->dropIndex(['status', 'created_at']);
            $table->dropColumn(['categoria', 'titulo', 'descricao', 'latitude', 'longitude', 'endereco', 'fotos_extras', 'origem']);
        });
        Schema::table('ecopontos', function (Blueprint $table) {
            $table->dropColumn(['categoria', 'latitude', 'longitude', 'endereco', 'horario']);
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_admin');
        });
    }
};
