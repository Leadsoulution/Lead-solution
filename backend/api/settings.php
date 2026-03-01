<?php
// /public_html/api/settings.php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $stmt = $pdo->query("SELECT * FROM settings");
            $settings = $stmt->fetchAll();
            $result = [];
            foreach ($settings as $setting) {
                $result[$setting['key_name']] = json_decode($setting['value'], true);
            }
            echo json_encode($result);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'POST':
        $data = getJsonInput();
        if (!$data) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON']);
            break;
        }

        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("INSERT INTO settings (key_name, value) VALUES (:key, :value) ON DUPLICATE KEY UPDATE value = :value");
            
            foreach ($data as $key => $value) {
                $stmt->execute([
                    ':key' => $key,
                    ':value' => json_encode($value)
                ]);
            }
            $pdo->commit();
            echo json_encode(['message' => 'Settings updated']);
        } catch (PDOException $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>
