<?php
$error_message = '';

try {
    $json = file_get_contents('../../configs/servo_config.json');
    if ($json === false) {
        throw new Exception('Failed to read JSON file.');
    }
    $data = json_decode($json, true);
    if ($data === null) {
        throw new Exception('Failed to decode JSON file.');
    }
} catch (Exception $e) {
    $error_message = $e->getMessage();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (isset($_POST['add'])) {
            $new_bus = [
                "name" => $_POST['name'],
                "address" => $_POST['address'],
                "scl_pin" => $_POST['scl_pin'],
                "sda_pin" => $_POST['sda_pin']
            ];
            $data['i2c_buses'][] = $new_bus;
        } elseif (isset($_POST['edit'])) {
            $index = $_POST['index'];
            $data['i2c_buses'][$index] = [
                "name" => $_POST['name'],
                "address" => $_POST['address'],
                "scl_pin" => $_POST['scl_pin'],
                "sda_pin" => $_POST['sda_pin']
            ];
        } elseif (isset($_POST['delete'])) {
            $index = $_POST['index'];
            array_splice($data['i2c_buses'], $index, 1);
        }

        $result = file_put_contents('../../configs/servo_config.json', json_encode($data, JSON_PRETTY_PRINT));
        if ($result === false) {
            throw new Exception('Failed to write to JSON file.');
        }
    } catch (Exception $e) {
        $error_message = $e->getMessage();
    }
}

$edit_bus = null;
if (isset($_GET['edit'])) {
    $index = $_GET['edit'];
    $edit_bus = $data['i2c_buses'][$index];
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Edit Buses</title>
</head>
<body>
    <h1>Edit Buses</h1>
    <?php if ($error_message): ?>
        <p style="color: red;"><?= htmlspecialchars($error_message) ?></p>
    <?php endif; ?>
    <form method="post">
        <input type="hidden" name="index" value="<?= isset($edit_bus) ? $index : '' ?>">
        <label>Name: <input type="text" name="name" value="<?= isset($edit_bus) ? htmlspecialchars($edit_bus['name']) : '' ?>"></label><br>
        <label>Address: <input type="text" name="address" value="<?= isset($edit_bus) ? htmlspecialchars($edit_bus['address']) : '' ?>"></label><br>
        <label>SCL Pin: <input type="text" name="scl_pin" value="<?= isset($edit_bus) ? htmlspecialchars($edit_bus['scl_pin']) : '' ?>"></label><br>
        <label>SDA Pin: <input type="text" name="sda_pin" value="<?= isset($edit_bus) ? htmlspecialchars($edit_bus['sda_pin']) : '' ?>"></label><br>
        <button type="submit" name="<?= isset($edit_bus) ? 'edit' : 'add' ?>"><?= isset($edit_bus) ? 'Save Changes' : 'Add Bus' ?></button>
    </form>

    <h2>Existing Buses</h2>
    <table border="1">
        <tr>
            <th>Name</th>
            <th>Address</th>
            <th>SCL Pin</th>
            <th>SDA Pin</th>
            <th>Actions</th>
        </tr>
        <?php if (isset($data['i2c_buses'])): ?>
            <?php foreach ($data['i2c_buses'] as $index => $bus): ?>
                <tr>
                    <td><?= htmlspecialchars($bus['name']) ?></td>
                    <td><?= htmlspecialchars($bus['address']) ?></td>
                    <td><?= htmlspecialchars($bus['scl_pin']) ?></td>
                    <td><?= htmlspecialchars($bus['sda_pin']) ?></td>
                    <td>
                        <a href="?edit=<?= $index ?>">Edit</a>
                        <form method="post" style="display:inline;">
                            <input type="hidden" name="index" value="<?= $index ?>">
                            <button type="submit" name="delete">Delete</button>
                        </form>
                    </td>
                </tr>
            <?php endforeach; ?>
        <?php endif; ?>
    </table>
</body>
</html>