<?php
// ================================================================
//  GERADOR DE CONTEÚDO BÍBLICO — Proxy Seguro para OpenAI
// ================================================================
//
//  INSTRUÇÃO: Substitua SUA_CHAVE_AQUI pela sua chave da OpenAI
//  (começa com sk-proj-...)
//
define('OPENAI_API_KEY', 'sk-proj-SUA_CHAVE_AQUI');
//
// ================================================================

// Cabeçalhos CORS e streaming
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('X-Accel-Buffering: no');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, OPTIONS');

// Pré-flight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Apenas POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido.']);
    exit();
}

// Validação básica da chave configurada
if (OPENAI_API_KEY === 'sk-proj-SUA_CHAVE_AQUI' || empty(OPENAI_API_KEY)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => [
            'message' => 'A chave da OpenAI não foi configurada. Edite o arquivo proxy/openai.php e insira sua chave.',
            'type' => 'configuration_error'
        ]
    ]);
    exit();
}

// Lê o corpo da requisição enviada pelo app
$body = file_get_contents('php://input');

if (empty($body)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => ['message' => 'Requisição vazia.']]);
    exit();
}

// Encaminha a requisição para a OpenAI com streaming
$ch = curl_init('https://api.openai.com/v1/chat/completions');

curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . OPENAI_API_KEY,
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 120);

// Escreve os chunks do stream em tempo real
curl_setopt($ch, CURLOPT_WRITEFUNCTION, function ($ch, $data) {
    echo $data;
    if (ob_get_level() > 0) {
        ob_flush();
    }
    flush();
    return strlen($data);
});

$success = curl_exec($ch);

if (!$success) {
    $error = curl_error($ch);
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => [
            'message' => 'Erro ao conectar com a OpenAI: ' . $error,
            'type' => 'proxy_error'
        ]
    ]);
}

curl_close($ch);
