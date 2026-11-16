<?php

namespace App\Policies;

use App\Models\Denuncia;
use App\Models\User;

/**
 * Permissões sobre denúncias — aplicadas igualmente ao app e ao painel web.
 */
class DenunciaPolicy
{
    /** Somente a equipe (administradores) altera o status. */
    public function updateStatus(User $user, Denuncia $denuncia): bool
    {
        return (bool) $user->is_admin;
    }

    /** O autor pode excluir enquanto ninguém analisou; administradores sempre. */
    public function delete(User $user, Denuncia $denuncia): bool
    {
        return (bool) $user->is_admin
            || ($denuncia->user_id === $user->id && $denuncia->status === 'pendente');
    }

    /** Qualquer usuário, exceto o autor, confirma ocorrências ainda abertas. */
    public function confirm(User $user, Denuncia $denuncia): bool
    {
        return $denuncia->user_id !== $user->id
            && ! in_array($denuncia->status, Denuncia::STATUS_FINAIS, true);
    }
}
