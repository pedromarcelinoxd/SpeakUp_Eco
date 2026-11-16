<?php

namespace App\Notifications;

use App\Models\Denuncia;
use App\Notifications\Channels\ExpoPushChannel;
use Illuminate\Notifications\Notification;

/**
 * Notificação do EcoRadar: gravada no banco (lida pelo app e pelo painel)
 * e enviada como push para os dispositivos do usuário.
 */
class EcoRadarNotification extends Notification
{
    public function __construct(
        public string $tipo,
        public string $titulo,
        public string $mensagem,
        public ?int $denunciaId = null,
    ) {}

    public static function denunciaRecebida(Denuncia $d): self
    {
        return new self('recebida', 'Sua denúncia foi recebida', "“".self::nome($d)."” foi registrada com o protocolo #{$d->id}.", $d->id);
    }

    public static function statusAtualizado(Denuncia $d): self
    {
        $mensagens = [
            'em_analise' => ['Sua denúncia está em análise', 'foi encaminhada para a equipe responsável.'],
            'verificada' => ['Sua denúncia foi verificada', 'foi confirmada pela equipe. Você ganhou 50 pontos!'],
            'resolvida' => ['Sua denúncia foi marcada como resolvida', 'foi solucionada. Obrigado por ajudar!'],
            'nao_confirmada' => ['Não foi possível confirmar sua denúncia', 'não pôde ser confirmada no local.'],
            'pendente' => ['Sua denúncia voltou para a fila', 'aguarda nova análise.'],
        ];
        [$titulo, $texto] = $mensagens[$d->status] ?? ['Status atualizado', 'teve o status atualizado.'];

        return new self('status', $titulo, "“".self::nome($d)."” {$texto}", $d->id);
    }

    public static function confirmada(Denuncia $d, int $total): self
    {
        return new self('confirmacao', 'Uma ocorrência recebeu confirmação', "{$total} ".($total === 1 ? 'pessoa confirmou' : 'pessoas confirmaram')." “".self::nome($d)."”.", $d->id);
    }

    private static function nome(Denuncia $d): string
    {
        return $d->titulo ?: "Denúncia #{$d->id}";
    }

    public function via(object $notifiable): array
    {
        return ['database', ExpoPushChannel::class];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'tipo' => $this->tipo,
            'titulo' => $this->titulo,
            'mensagem' => $this->mensagem,
            'denuncia_id' => $this->denunciaId,
        ];
    }

    public function toExpo(object $notifiable): array
    {
        return [
            'title' => $this->titulo,
            'body' => $this->mensagem,
            'data' => ['tipo' => $this->tipo, 'denuncia_id' => $this->denunciaId],
        ];
    }
}
