<?php

namespace App\Notifications\Channels;

use App\Models\PushToken;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Envia notificações push para o app mobile pelo serviço da Expo
 * (https://docs.expo.dev/push-notifications/sending-notifications/).
 * Não exige chave; tokens inválidos são removidos automaticamente.
 */
class ExpoPushChannel
{
    public const ENDPOINT = 'https://exp.host/--/api/v2/push/send';

    public function send(object $notifiable, Notification $notification): void
    {
        $tokens = $notifiable->routeNotificationFor('expo', $notification);
        if (empty($tokens) || ! method_exists($notification, 'toExpo')) {
            return;
        }

        $payload = $notification->toExpo($notifiable);
        $messages = array_map(fn ($token) => [
            'to' => $token,
            'sound' => 'default',
            'title' => $payload['title'],
            'body' => $payload['body'],
            'data' => $payload['data'] ?? [],
        ], $tokens);

        try {
            $response = Http::timeout(5)->acceptJson()->post(self::ENDPOINT, $messages);
            foreach ($response->json('data', []) as $i => $ticket) {
                if (($ticket['details']['error'] ?? null) === 'DeviceNotRegistered') {
                    PushToken::where('token', $tokens[$i] ?? null)->delete();
                }
            }
        } catch (Throwable $e) {
            // O push nunca deve impedir a operação principal.
            Log::warning('Falha ao enviar push Expo: '.$e->getMessage());
        }
    }
}
