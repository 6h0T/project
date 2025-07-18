<?php
$access = true;
require_once 'conex.php';

echo "<h2>🔍 Explorador de Base de Datos</h2>";

// Listar todas las tablas
echo "<h3>📋 Tablas disponibles:</h3>";
$result = $conn->query("SHOW TABLES");
$tables = [];

if ($result) {
    while ($row = $result->fetch_row()) {
        $tables[] = $row[0];
        echo "<li><strong>{$row[0]}</strong></li>";
    }
}

// Mostrar estructura de cada tabla
foreach ($tables as $table) {
    echo "<h3>🗂️ Estructura de: $table</h3>";
    $result = $conn->query("DESCRIBE $table");
    
    if ($result) {
        echo "<table border='1' style='border-collapse: collapse; margin: 10px 0;'>";
        echo "<tr><th>Campo</th><th>Tipo</th><th>Null</th><th>Key</th><th>Default</th></tr>";
        
        while ($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td>{$row['Field']}</td>";
            echo "<td>{$row['Type']}</td>";
            echo "<td>{$row['Null']}</td>";
            echo "<td>{$row['Key']}</td>";
            echo "<td>{$row['Default']}</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        // Mostrar algunos registros de ejemplo
        $sample = $conn->query("SELECT * FROM $table LIMIT 3");
        if ($sample && $sample->num_rows > 0) {
            echo "<p><strong>📊 Datos de ejemplo:</strong></p>";
            echo "<pre>";
            while ($row = $sample->fetch_assoc()) {
                print_r($row);
            }
            echo "</pre>";
        }
    }
    echo "<hr>";
}

$conn->close();
?>