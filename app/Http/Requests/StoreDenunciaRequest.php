<?php

namespace App\Http\Requests;

use App\Models\Denuncia;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Regras de cadastro de denúncia — as mesmas para app mobile e painel web.
 *
 * Compatível com o formato original (ponto_referencia do campus) e com o novo
 * formato geolocalizado (latitude/longitude obtidas pelo GPS ou pelo mapa).
 */
class StoreDenunciaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Texto com codificação inválida quebraria a listagem (JSON) para todos os clientes.
        $utf8 = function (string $attribute, mixed $value, \Closure $fail) {
            if (is_string($value) && ! mb_check_encoding($value, 'UTF-8')) {
                $fail('O texto enviado tem caracteres inválidos. Envie em UTF-8.');
            }
        };

        return [
            'foto' => ['required', 'image', 'mimes:jpeg,png,jpg', 'max:5120'],
            'fotos' => ['nullable', 'array', 'max:4'],
            'fotos.*' => ['image', 'mimes:jpeg,png,jpg', 'max:5120'],
            'categoria' => ['nullable', Rule::in(Denuncia::CATEGORIAS)],
            'titulo' => ['nullable', 'string', 'min:5', 'max:120', $utf8],
            'descricao' => ['nullable', 'string', 'max:1000', $utf8],
            'latitude' => ['required_without:ponto_referencia', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['required_without:ponto_referencia', 'nullable', 'numeric', 'between:-180,180'],
            'endereco' => ['nullable', 'string', 'max:255', $utf8],
            'ponto_referencia' => ['required_without:latitude', 'nullable', 'string', Rule::in(Denuncia::PONTOS_REFERENCIA)],
            'detalhes_localizacao' => ['nullable', 'string', 'max:1000', $utf8],
            'criticidade' => ['required', 'string', Rule::in(Denuncia::CRITICIDADES)],
            'origem' => ['nullable', Rule::in(['web', 'app'])],
        ];
    }

    public function messages(): array
    {
        return [
            'foto.required' => 'Adicione pelo menos uma fotografia da ocorrência.',
            'latitude.required_without' => 'Informe a localização da ocorrência.',
            'longitude.required_without' => 'Informe a localização da ocorrência.',
        ];
    }
}
