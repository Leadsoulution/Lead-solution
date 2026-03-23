<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$storeUrl = isset($input['storeUrl']) ? $input['storeUrl'] : '';
$accessToken = isset($input['accessToken']) ? $input['accessToken'] : '';

if (empty($storeUrl) || empty($accessToken)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing parameters']);
    exit;
}

$storeUrl = rtrim($storeUrl, '/');
$url = $storeUrl . '/admin/api/2024-01/orders.json?status=any';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'X-Shopify-Access-Token: ' . $accessToken,
    'Content-Type: application/json'
));

$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => 'Curl error: ' . curl_error($ch)]);
} else {
    http_response_code($httpCode);
    echo $result;
}

curl_close($ch);
?>
