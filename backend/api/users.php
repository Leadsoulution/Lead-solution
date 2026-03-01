<?php
// /public_html/api/users.php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $stmt = $pdo->query("SELECT id, username, email, role, assigned_product_ids, permissions, created_at FROM users ORDER BY username ASC");
            $users = $stmt->fetchAll();
            foreach ($users as &$user) {
                if ($user['assigned_product_ids']) {
                    $user['assigned_product_ids'] = json_decode($user['assigned_product_ids'], true);
                }
                if ($user['permissions']) {
                    $user['permissions'] = json_decode($user['permissions'], true);
                }
            }
            echo json_encode($users);
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

        // Basic validation
        if (!isset($data['username']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Username and password required']);
            break;
        }

        try {
            $sql = "INSERT INTO users (id, username, password_hash, email, role, assigned_product_ids, permissions) 
                    VALUES (:id, :username, :password_hash, :email, :role, :assigned_product_ids, :permissions)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $data['id'],
                ':username' => $data['username'],
                ':password_hash' => password_hash($data['password'], PASSWORD_DEFAULT),
                ':email' => $data['email'] ?? null,
                ':role' => $data['role'] ?? 'User',
                ':assigned_product_ids' => isset($data['assignedProductIds']) ? json_encode($data['assignedProductIds']) : null,
                ':permissions' => isset($data['permissions']) ? json_encode($data['permissions']) : null
            ]);
            
            http_response_code(201);
            echo json_encode(['message' => 'User created', 'id' => $data['id']]);
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
                'username' => 'username',
                'email' => 'email',
                'role' => 'role',
                'assignedProductIds' => 'assigned_product_ids',
                'permissions' => 'permissions'
            ];

            foreach ($data as $key => $value) {
                if (isset($mapping[$key])) {
                    $dbField = $mapping[$key];
                    $fields[] = "$dbField = :$dbField";
                    if ($key === 'assignedProductIds' || $key === 'permissions') {
                        $params[":$dbField"] = json_encode($value);
                    } else {
                        $params[":$dbField"] = $value;
                    }
                }
            }

            if (isset($data['password']) && !empty($data['password'])) {
                $fields[] = "password_hash = :password_hash";
                $params[':password_hash'] = password_hash($data['password'], PASSWORD_DEFAULT);
            }

            if (empty($fields)) {
                http_response_code(400);
                echo json_encode(['message' => 'No fields to update']);
                break;
            }

            $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            echo json_encode(['message' => 'User updated']);
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
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(['message' => 'User deleted']);
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
