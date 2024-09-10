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
            $new_servo = [
                "id" => (int)$_POST['id'],
                "name" => $_POST['name'],
                "bus" => $_POST['bus'],
                "default_position" => (int)$_POST['default_position'],
                "open_position" => (int)$_POST['open_position'],
                "close_position" => (int)$_POST['close_position'],
                "position" => (int)$_POST['position']
            ];
            $data['servos'][] = $new_servo;
        } elseif (isset($_POST['edit'])) {
            $index = $_POST['index'];
            $data['servos'][$index] = [
                "id" => (int)$_POST['id'],
                "name" => $_POST['name'],
                "bus" => $_POST['bus'],
                "default_position" => (int)$_POST['default_position'],
                "open_position" => (int)$_POST['open_position'],
                "close_position" => (int)$_POST['close_position'],
                "position" => (int)$_POST['position']
            ];
        } elseif (isset($_POST['delete'])) {
            $index = $_POST['index'];
            array_splice($data['servos'], $index, 1);
        }

        $result = file_put_contents('../../configs/servo_config.json', json_encode($data, JSON_PRETTY_PRINT));
        if ($result === false) {
            throw new Exception('Failed to write to JSON file.');
        }
    } catch (Exception $e) {
        $error_message = $e->getMessage();
    }
}

$edit_servo = null;
if (isset($_GET['edit'])) {
    $index = $_GET['edit'];
    $edit_servo = $data['servos'][$index];
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Edit Servos</title>
</head>
<body>
    <h1>Edit Servos</h1>
    <?php if ($error_message): ?>
        <p style="color: red;"><?= htmlspecialchars($error_message) ?></p>
    <?php endif; ?>
    <form method="post">
        <input type="hidden" name="index" value="<?= isset($edit_servo) ? $index : '' ?>">
        <label>ID: <input type="text" name="id" value="<?= isset($edit_servo) ? htmlspecialchars($edit_servo['id']) : '' ?>"></label><br>
        <label>Name: <input type="text" name="name" value="<?= isset($edit_servo) ? htmlspecialchars($edit_servo['name']) : '' ?>"></label><br>
        <label>Bus: <input type="text" name="bus" value="<?= isset($edit_servo) ? htmlspecialchars($edit_servo['bus']) : '' ?>"></label><br>
        <label>Default Position: <input type="text" name="default_position" value="<?= isset($edit_servo) ? htmlspecialchars($edit_servo['default_position']) : '' ?>"></label><br>
        <label>Open Position: <input type="text" name="open_position" value="<?= isset($edit_servo) ? htmlspecialchars($edit_servo['open_position']) : '' ?>"></label><br>
        <label>Close Position: <input type="text" name="close_position" value="<?= isset($edit_servo) ? htmlspecialchars($edit_servo['close_position']) : '' ?>"></label><br>
        <label>Position: <input type="text" name="position" value="<?= isset($edit_servo) ? htmlspecialchars($edit_servo['position']) : '' ?>"></label><br>
        <button type="submit" name="<?= isset($edit_servo) ? 'edit' : 'add' ?>"><?= isset($edit_servo) ? 'Save Changes' : 'Add Servo' ?></button>
    </form>

    <h2>Existing Servos</h2>
    <table border="1">
        <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Bus</th>
            <th>Default Position</th>
            <th>Open Position</th>
            <th>Close Position</th>
            <th>Position</th>
            <th>Actions</th>
        </tr>
        <?php if (isset($data['servos'])): ?>
            <?php foreach ($data['servos'] as $index => $servo): ?>
                <tr>
                    <td><?= htmlspecialchars($servo['id']) ?></td>
                    <td><?= htmlspecialchars($servo['name']) ?></td>
                    <td><?= htmlspecialchars($servo['bus']) ?></td>
                    <td><?= htmlspecialchars($servo['default_position']) ?></td>
                    <td><?= htmlspecialchars($servo['open_position']) ?></td>
                    <td><?= htmlspecialchars($servo['close_position']) ?></td>
                    <td><?= htmlspecialchars($servo['position']) ?></td>
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