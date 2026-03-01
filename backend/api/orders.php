<?php
// /public_html/api/orders.php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $stmt = $pdo->query("SELECT * FROM orders ORDER BY created_at DESC");
            $orders = $stmt->fetchAll();
            // Convert JSON fields back to arrays
            foreach ($orders as &$order) {
                if ($order['custom_fields']) {
                    $order['custom_fields'] = json_decode($order['custom_fields'], true);
                }
            }
            echo json_encode($orders);
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
            $sql = "INSERT INTO orders (id, date, customer_name, customer_phone, address, price, product, status, assigned_user_id, note_client, ramassage, livraison, remboursement, commande_retour, platform, call_count, custom_fields) 
                    VALUES (:id, :date, :customer_name, :customer_phone, :address, :price, :product, :status, :assigned_user_id, :note_client, :ramassage, :livraison, :remboursement, :commande_retour, :platform, :call_count, :custom_fields)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $data['id'],
                ':date' => $data['date'],
                ':customer_name' => $data['customerName'],
                ':customer_phone' => $data['customerPhone'],
                ':address' => $data['address'],
                ':price' => $data['price'],
                ':product' => $data['product'],
                ':status' => $data['statut'],
                ':assigned_user_id' => $data['assignedUserId'] ?? null,
                ':note_client' => $data['noteClient'] ?? '',
                ':ramassage' => $data['ramassage'] ?? 'Non défini',
                ':livraison' => $data['livraison'] ?? 'Non défini',
                ':remboursement' => $data['remboursement'] ?? 'Non défini',
                ':commande_retour' => $data['commandeRetour'] ?? 'Non défini',
                ':platform' => $data['platform'] ?? 'Manual',
                ':call_count' => $data['callCount'] ?? 0,
                ':custom_fields' => isset($data['customFields']) ? json_encode($data['customFields']) : null
            ]);
            
            http_response_code(201);
            echo json_encode(['message' => 'Order created', 'id' => $data['id']]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'PUT':
        $data = getJsonInput();
        if (!$data || !isset($data['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID required']);
            break;
        }

        try {
            // Build dynamic update query
            $fields = [];
            $params = [':id' => $data['id']];
            
            $mapping = [
                'customerName' => 'customer_name',
                'customerPhone' => 'customer_phone',
                'address' => 'address',
                'price' => 'price',
                'product' => 'product',
                'statut' => 'status',
                'assignedUserId' => 'assigned_user_id',
                'noteClient' => 'note_client',
                'ramassage' => 'ramassage',
                'livraison' => 'livraison',
                'remboursement' => 'remboursement',
                'commandeRetour' => 'commande_retour',
                'platform' => 'platform',
                'callCount' => 'call_count',
                'customFields' => 'custom_fields'
            ];

            foreach ($data as $key => $value) {
                if (isset($mapping[$key])) {
                    $dbField = $mapping[$key];
                    $fields[] = "$dbField = :$dbField";
                    if ($key === 'customFields') {
                        $params[":$dbField"] = json_encode($value);
                    } else {
                        $params[":$dbField"] = $value;
                    }
                }
            }

            if (empty($fields)) {
                http_response_code(400);
                echo json_encode(['message' => 'No fields to update']);
                break;
            }

            $sql = "UPDATE orders SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            echo json_encode(['message' => 'Order updated']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID required']);
            break;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM orders WHERE id = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(['message' => 'Order deleted']);
        } catch (PDOException $e) {
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
