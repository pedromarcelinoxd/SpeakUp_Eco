<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * No PostgreSQL, a coluna `status` criada como enum vira texto com uma regra
 * CHECK que aceita só os valores antigos (pendente, em_analise, resolvida).
 * A migração que transformou `status` em string não remove essa regra, e os
 * status novos ("verificada", "nao_confirmada") seriam recusados.
 *
 * Só atua no PostgreSQL; no SQLite e no MySQL não faz nada. Não apaga dados.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE denuncias DROP CONSTRAINT IF EXISTS denuncias_status_check');
    }

    public function down(): void
    {
        // Recriar a regra recusaria registros com os status novos; nada a desfazer.
    }
};
