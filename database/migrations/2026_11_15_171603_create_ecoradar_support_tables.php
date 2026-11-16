<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabelas de apoio compartilhadas entre app mobile e painel web:
 *  - confirmações de ocorrência (1 por usuário por denúncia);
 *  - histórico de status (linha do tempo);
 *  - tokens de push (Expo) por dispositivo.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('denuncia_confirmacoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('denuncia_id')->constrained('denuncias')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['denuncia_id', 'user_id']);
        });

        Schema::create('denuncia_status_historico', function (Blueprint $table) {
            $table->id();
            $table->foreignId('denuncia_id')->constrained('denuncias')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status', 20);
            $table->string('observacao', 500)->nullable();
            $table->timestamps();
        });

        Schema::create('push_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('token')->unique();
            $table->string('plataforma', 10)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_tokens');
        Schema::dropIfExists('denuncia_status_historico');
        Schema::dropIfExists('denuncia_confirmacoes');
    }
};
