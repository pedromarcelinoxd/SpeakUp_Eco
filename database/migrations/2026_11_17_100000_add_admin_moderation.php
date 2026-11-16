<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Administração do SpeakUp Eco (mudanças ADITIVAS):
 *  - users: bloqueio de conta (data, motivo e quem bloqueou);
 *  - denuncias: ocultação por moderação (some do mapa público sem ser apagada).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('bloqueado_em')->nullable()->after('is_admin');
            $table->string('bloqueio_motivo', 255)->nullable()->after('bloqueado_em');
            $table->foreignId('bloqueado_por')->nullable()->after('bloqueio_motivo')->constrained('users')->nullOnDelete();
        });

        Schema::table('denuncias', function (Blueprint $table) {
            $table->timestamp('oculta_em')->nullable()->after('status');
            $table->string('oculta_motivo', 255)->nullable()->after('oculta_em');
            $table->foreignId('oculta_por')->nullable()->after('oculta_motivo')->constrained('users')->nullOnDelete();
            $table->index('oculta_em');
        });
    }

    public function down(): void
    {
        Schema::table('denuncias', function (Blueprint $table) {
            $table->dropIndex(['oculta_em']);
            $table->dropConstrainedForeignId('oculta_por');
            $table->dropColumn(['oculta_em', 'oculta_motivo']);
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('bloqueado_por');
            $table->dropColumn(['bloqueado_em', 'bloqueio_motivo']);
        });
    }
};
