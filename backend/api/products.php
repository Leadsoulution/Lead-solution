<?php
// /public_html/api/products.php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $stmt = $pdo->query("SELECT * FROM products ORDER BY name ASC");
            $products = $stmt->fetchAll();
            foreach ($products as &$product) {
                if ($product['custom_fields']) {
                    $product['custom_fields'] = json_decode($product['custom_fields'], true);
                }
            }
            echo json_encode($products);
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
            $sql = "INSERT INTO products (id, name, image_url, initial_stock, purchase_price, selling_price, discount, show_in_orders, category, custom_fields) 
                    VALUES (:id, :name, :image_url, :initial_stock, :purchase_price, :selling_price, :discount, :show_in_orders, :category, :custom_fields)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $data['id'],
                ':name' => $data['name'],
                ':image_url' => $data['imageUrl'] ?? '',
                ':initial_stock' => $data['initialStock'] ?? 0,
                ':purchase_price' => $data['purchasePrice'] ?? 0.00,
                ':selling_price' => $data['sellingPrice'] ?? 0.00,
                ':discount' => $data['discount'] ?? 0.00,
                ':show_in_orders' => $data['showInOrders'] ?? 1,
                ':category' => $data['category'] ?? null,
                ':custom_fields' => isset($data['customFields']) ? json_encode($data['customFields']) : null
            ]);
            
            http_response_code(201);
            echo json_encode(['message' => 'Product created', 'id' => $data['id']]);
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
                'name' => 'name',
                'imageUrl' => 'image_url',
                'initialStock' => 'initial_stock',
                'purchasePrice' => 'purchase_price',
                'sellingPrice' => 'selling_price',
                'discount' => 'discount',
                'showInOrders' => 'show_in_orders',
                'category' => 'category',
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

            $sql = "UPDATE products SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            echo json_encode(['message' => 'Product updated']);
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
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(['message' => 'Product deleted']);
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
