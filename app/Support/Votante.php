<?php

namespace App\Support;

use App\Models\Denuncia;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Quem está agindo: uma conta (token Sanctum) ou um dispositivo anônimo.
 *
 * O app e o painel geram um identificador aleatório por dispositivo e o enviam no
 * cabeçalho X-EcoRadar-Dispositivo. O servidor guarda apenas um HMAC desse valor
 * (nunca o valor em si, nem IP), o suficiente para impedir votos repetidos sem
 * identificar a pessoa.
 */
final class Votante
{
    public const CABECALHO = 'X-EcoRadar-Dispositivo';

    private function __construct(public readonly ?User $user, public readonly ?string $dispositivo) {}

    public static function daRequisicao(Request $request): ?self
    {
        $user = $request->user('sanctum');
        $dispositivo = self::hashDispositivo($request->header(self::CABECALHO));

        if ($user) {
            return new self($user, $dispositivo);
        }

        return $dispositivo ? new self(null, $dispositivo) : null;
    }

    public static function hashDispositivo(?string $valor): ?string
    {
        if (! $valor || ! preg_match('/^[A-Za-z0-9-]{16,64}$/', $valor)) {
            return null;
        }

        return hash_hmac('sha256', $valor, (string) config('app.key'));
    }

    /** Chave única do votante: "u:<id>" para contas, "d:<hash>" para dispositivos. */
    public function chave(): string
    {
        return $this->user ? 'u:'.$this->user->id : 'd:'.$this->dispositivo;
    }

    /** Chaves possíveis desta pessoa (conta e dispositivo), para bloquear votos duplicados. */
    public function chaves(): array
    {
        return array_values(array_filter([
            $this->user ? 'u:'.$this->user->id : null,
            $this->dispositivo ? 'd:'.$this->dispositivo : null,
        ]));
    }

    public function ehAutor(Denuncia $denuncia): bool
    {
        if ($this->user && $denuncia->user_id === $this->user->id) {
            return true;
        }

        return $this->dispositivo && $denuncia->autor_hash && hash_equals($denuncia->autor_hash, $this->dispositivo);
    }

    /** Chave para limitar a taxa de envios (conta, dispositivo ou IP como último recurso). */
    public static function chaveLimite(Request $request): string
    {
        $v = self::daRequisicao($request);

        return $v ? $v->chave() : 'ip:'.$request->ip();
    }
}
