<?php

namespace App\Http\Requests;

use App\Models\Denuncia;
use App\Models\Ecoponto;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EcopontoRequest extends FormRequest
{
    public function authorize(): bool
    {
        // A autorização de rotas protegidas já ocorre no middleware auth:sanctum
        return true;
    }

    public function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'max:255'],
            'categoria' => ['nullable', Rule::in(Ecoponto::CATEGORIAS)],
            'ponto_referencia' => ['required_without:latitude', 'nullable', 'string', Rule::in(Denuncia::PONTOS_REFERENCIA)],
            'latitude' => ['required_without:ponto_referencia', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['required_without:ponto_referencia', 'nullable', 'numeric', 'between:-180,180'],
            'endereco' => ['nullable', 'string', 'max:255'],
            'horario' => ['nullable', 'string', 'max:120'],
            'descricao_local' => ['nullable', 'string', 'max:500'],
            'residuos_aceitos' => ['required', 'array'],
            'residuos_aceitos.*' => ['string', 'max:100'],
        ];
    }
}
