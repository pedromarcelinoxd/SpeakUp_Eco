<?php

namespace App\Http\Requests;

use App\Models\CategoriaOcorrencia;
use App\Models\Denuncia;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Regras de cadastro de denúncia — as mesmas para app mobile e painel web,
 * com ou sem conta.
 *
 * Compatível com o formato original (ponto_referencia do campus) e com o novo
 * formato geolocalizado (latitude/longitude obtidas pelo GPS ou pelo mapa).
 */
class StoreDenunciaRequest extends FormRequest
{
    /** Fotos: até 5 por denúncia (1 capa + 4 extras), 5 MB cada, JPG/PNG/WebP. */
    public const MAX_FOTOS_EXTRAS = 4;

    public const MAX_KB = 5120;

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

        // Denúncias são públicas: não publicar contato pessoal nem links (privacidade e spam).
        $semContato = function (string $attribute, mixed $value, \Closure $fail) {
            if (! is_string($value)) {
                return;
            }
            $link = '/(https?:\/\/|www\.)\S+/i';
            $email = '/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i';
            $telefone = '/(\+?55\s?)?(\(?\d{2}\)?\s?)?9?\d{4}[-\s]?\d{4}/';
            if (preg_match($link, $value) || preg_match($email, $value) || preg_match($telefone, $value)) {
                $fail('Por segurança, não inclua links, e-mails ou telefones na denúncia.');
            }
        };

        $foto = ['image', 'mimes:jpeg,png,jpg,webp', 'max:'.self::MAX_KB, 'dimensions:min_width=200,min_height=200,max_width=16000,max_height=16000'];

        return [
            'foto' => ['required', ...$foto],
            'fotos' => ['nullable', 'array', 'max:'.self::MAX_FOTOS_EXTRAS],
            'fotos.*' => $foto,
            'categoria' => ['nullable', Rule::in(CategoriaOcorrencia::slugsAtivos() ?: Denuncia::CATEGORIAS)], // padrão: outros (formato legado)
            // Título obrigatório no formato geolocalizado; o formato legado do campus não envia título
            'titulo' => ['required_without:ponto_referencia', 'nullable', 'string', 'min:5', 'max:120', $utf8, $semContato],
            'descricao' => ['nullable', 'string', 'max:1000', $utf8, $semContato],
            'latitude' => ['required_without:ponto_referencia', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['required_without:ponto_referencia', 'nullable', 'numeric', 'between:-180,180'],
            'endereco' => ['nullable', 'string', 'max:255', $utf8],
            'ponto_referencia' => ['required_without:latitude', 'nullable', 'string', Rule::in(Denuncia::PONTOS_REFERENCIA)],
            'detalhes_localizacao' => ['nullable', 'string', 'max:1000', $utf8, $semContato],
            'criticidade' => ['nullable', 'string', Rule::in(Denuncia::CRITICIDADES)],
            'origem' => ['nullable', Rule::in(['web', 'app'])],
            // Enviar mesmo havendo denúncia parecida por perto (o cliente pergunta antes)
            'ignorar_duplicata' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'foto.required' => 'Adicione pelo menos uma fotografia da ocorrência.',
            'foto.max' => 'Cada foto pode ter no máximo 5 MB.',
            'fotos.*.max' => 'Cada foto pode ter no máximo 5 MB.',
            'fotos.max' => 'Envie no máximo 5 fotos por denúncia.',
            'foto.dimensions' => 'A foto é muito pequena ou muito grande.',
            'fotos.*.dimensions' => 'Uma das fotos é muito pequena ou muito grande.',
            'categoria.required' => 'Escolha a categoria da ocorrência.',
            'titulo.required_without' => 'Dê um título curto para a ocorrência.',
            'latitude.required_without' => 'Informe a localização da ocorrência.',
            'longitude.required_without' => 'Informe a localização da ocorrência.',
        ];
    }
}
