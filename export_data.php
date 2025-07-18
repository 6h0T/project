<?php
// Script para exportar datos del proyecto PHP original
$access = true; // Permitir acceso a conex.php
require_once 'conex.php';

header('Content-Type: application/json; charset=utf-8');

function exportData() {
    global $conn;
    
    $exportData = [
        'servers' => [],
        'users' => [],
        'banners' => [],
        'votes' => [],
        'categories' => []
    ];
    
    try {
        // 1. Exportar servidores (ajusta el nombre de tabla según tu BD)
        $tables_to_check = ['servers', 'servidores', 'server_list', 'sv_servers'];
        $server_table = null;
        
        foreach ($tables_to_check as $table) {
            $result = $conn->query("SHOW TABLES LIKE '$table'");
            if ($result && $result->num_rows > 0) {
                $server_table = $table;
                break;
            }
        }
        
        if ($server_table) {
            $query = "SELECT * FROM $server_table ORDER BY id";
            $result = $conn->query($query);
            
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $exportData['servers'][] = $row;
                }
            }
        }
        
        // 2. Exportar usuarios
        $user_tables = ['users', 'usuarios', 'user_accounts'];
        $user_table = null;
        
        foreach ($user_tables as $table) {
            $result = $conn->query("SHOW TABLES LIKE '$table'");
            if ($result && $result->num_rows > 0) {
                $user_table = $table;
                break;
            }
        }
        
        if ($user_table) {
            $query = "SELECT * FROM $user_table ORDER BY id";
            $result = $conn->query($query);
            
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    // No exportar contraseñas por seguridad
                    unset($row['password']);
                    unset($row['pass']);
                    $exportData['users'][] = $row;
                }
            }
        }
        
        // 3. Exportar banners
        $banner_tables = ['banners', 'advertisements', 'ads'];
        $banner_table = null;
        
        foreach ($banner_tables as $table) {
            $result = $conn->query("SHOW TABLES LIKE '$table'");
            if ($result && $result->num_rows > 0) {
                $banner_table = $table;
                break;
            }
        }
        
        if ($banner_table) {
            $query = "SELECT * FROM $banner_table ORDER BY id";
            $result = $conn->query($query);
            
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $exportData['banners'][] = $row;
                }
            }
        }
        
        // 4. Exportar votos
        $vote_tables = ['votes', 'votos', 'server_votes'];
        $vote_table = null;
        
        foreach ($vote_tables as $table) {
            $result = $conn->query("SHOW TABLES LIKE '$table'");
            if ($result && $result->num_rows > 0) {
                $vote_table = $table;
                break;
            }
        }
        
        if ($vote_table) {
            $query = "SELECT * FROM $vote_table ORDER BY id DESC LIMIT 10000"; // Limitar para no sobrecargar
            $result = $conn->query($query);
            
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $exportData['votes'][] = $row;
                }
            }
        }
        
        // 5. Listar todas las tablas disponibles para referencia
        $result = $conn->query("SHOW TABLES");
        $exportData['available_tables'] = [];
        
        if ($result) {
            while ($row = $result->fetch_row()) {
                $exportData['available_tables'][] = $row[0];
            }
        }
        
        // Estadísticas de exportación
        $exportData['export_stats'] = [
            'servers_count' => count($exportData['servers']),
            'users_count' => count($exportData['users']),
            'banners_count' => count($exportData['banners']),
            'votes_count' => count($exportData['votes']),
            'export_date' => date('Y-m-d H:i:s'),
            'server_table_used' => $server_table,
            'user_table_used' => $user_table,
            'banner_table_used' => $banner_table,
            'vote_table_used' => $vote_table
        ];
        
        return $exportData;
        
    } catch (Exception $e) {
        return [
            'error' => true,
            'message' => $e->getMessage(),
            'available_tables' => []
        ];
    }
}

// Ejecutar exportación
$data = exportData();

// Guardar en archivo JSON
$filename = 'export_' . date('Y-m-d_H-i-s') . '.json';
file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// Mostrar resultado
echo json_encode([
    'success' => true,
    'message' => 'Exportación completada',
    'filename' => $filename,
    'stats' => $data['export_stats'] ?? [],
    'download_url' => 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . '/' . $filename
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

$conn->close();
?>