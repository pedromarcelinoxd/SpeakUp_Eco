<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Validação comunitária, denúncias sem conta e categorias no banco.
 *
 * Mudanças ADITIVAS (nada é apagado):
 *  - categorias_ocorrencia: catálogo de categorias com cor e ícone (fonte única para app e painel);
 *  - denuncia_validacoes: um voto por pessoa e ocorrência ("existe" ou "resolvida"),
 *    com data/hora e identificação (conta ou dispositivo anônimo, guardado só como hash);
 *  - denuncias.user_id passa a aceitar nulo (denúncia sem conta) + autor_hash do dispositivo;
 *  - status com mais espaço ("possivelmente_resolvida") e origem de cada mudança no histórico;
 *  - as confirmações antigas (denuncia_confirmacoes) são copiadas como votos "existe".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categorias_ocorrencia', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 40)->unique();
            $table->string('nome', 60);
            $table->string('descricao', 160)->nullable();
            $table->string('cor', 7);
            $table->string('icone', 40);
            $table->unsignedSmallInteger('ordem')->default(0);
            $table->boolean('ativo')->default(true);
            $table->timestamps();
        });

        $agora = now();
        $categorias = [
            ['descarte_irregular', 'Descarte irregular', 'Lixo ou resíduos abandonados em local inadequado', '#C2410C', 'trash'],
            ['entulho', 'Entulho', 'Restos de construção, reforma ou demolição', '#8B5E34', 'brick'],
            ['eletronicos', 'Resíduos eletrônicos', 'Aparelhos, pilhas, baterias ou cabos descartados', '#7C3AED', 'cpu'],
            ['poluicao_agua', 'Poluição da água', 'Esgoto, óleo ou resíduos em rios e córregos', '#0369A1', 'droplets'],
            ['queimada', 'Queimada', 'Fogo em terreno, vegetação ou queima de lixo', '#DC2626', 'flame'],
            ['dano_ambiental', 'Dano ambiental', 'Corte de árvores, aterro ou dano à fauna', '#BE185D', 'axe'],
            ['outros', 'Outro problema', 'Algo que não se encaixa acima', '#475569', 'help'],
        ];
        foreach ($categorias as $i => [$slug, $nome, $descricao, $cor, $icone]) {
            DB::table('categorias_ocorrencia')->insert([
                'slug' => $slug, 'nome' => $nome, 'descricao' => $descricao, 'cor' => $cor, 'icone' => $icone,
                'ordem' => $i, 'ativo' => true, 'created_at' => $agora, 'updated_at' => $agora,
            ]);
        }

        Schema::create('denuncia_validacoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('denuncia_id')->constrained('denuncias')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            // "u:<id>" para contas, "d:<hash>" para dispositivos anônimos — garante um voto por pessoa
            $table->string('votante', 80);
            $table->string('tipo', 12); // existe | resolvida
            $table->timestamps();
            $table->unique(['denuncia_id', 'votante']);
            $table->index(['denuncia_id', 'tipo']);
        });

        Schema::table('denuncias', function (Blueprint $table) {
            $table->string('autor_hash', 64)->nullable()->after('user_id');
            $table->index('autor_hash');
        });
        Schema::table('denuncias', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change();
            $table->string('status', 30)->default('pendente')->change();
        });

        Schema::table('denuncia_status_historico', function (Blueprint $table) {
            $table->string('status', 30)->change();
            $table->string('origem', 12)->nullable()->after('status'); // autor | comunidade | equipe
        });

        // Confirmações antigas viram votos "existe" (a tabela antiga é mantida).
        $antigas = DB::table('denuncia_confirmacoes')->get();
        foreach ($antigas as $c) {
            DB::table('denuncia_validacoes')->insertOrIgnore([
                'denuncia_id' => $c->denuncia_id, 'user_id' => $c->user_id, 'votante' => 'u:'.$c->user_id,
                'tipo' => 'existe', 'created_at' => $c->created_at, 'updated_at' => $c->updated_at,
            ]);
        }

        // Histórico existente: quem mudou o status foi a equipe; o registro inicial é do autor.
        DB::table('denuncia_status_historico')->where('status', 'pendente')->update(['origem' => 'autor']);
        DB::table('denuncia_status_historico')->where('status', '!=', 'pendente')->update(['origem' => 'equipe']);
    }

    public function down(): void
    {
        Schema::table('denuncia_status_historico', function (Blueprint $table) {
            $table->dropColumn('origem');
        });
        Schema::table('denuncias', function (Blueprint $table) {
            $table->dropIndex(['autor_hash']);
            $table->dropColumn('autor_hash');
        });
        Schema::dropIfExists('denuncia_validacoes');
        Schema::dropIfExists('categorias_ocorrencia');
    }
};
