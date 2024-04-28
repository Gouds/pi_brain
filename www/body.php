<?php

include("config.php");

$json = file_get_contents("http://localhost:8000/body/list");
$servo_list = json_decode($json, true);  // Convert the JSON array into a PHP array

?>
<div class="servowrapper">
    <div class="diagram">
        <img src="images/body.png" width="300" height="300" alt="Body Diagram">
    </div>
    <div class="table">
        <table>
            <thead>
            <tr>
                <th>Panel</th>
                <th colspan=2>Control</th>
            </tr>
            </thead>
            <tbody>
<?php

$i = 0;
foreach ($servo_list as $servo) {
    $i++;
    $key = $servo["name"];
    echo "<tr>
            <td class='panel'>$i $key</td>
            <td><a href=\"#\" onclick=\"sendRequest('http://localhost:8000/servo/open/$key')\">Open</a></td>
            <td><a href=\"#\" onclick=\"sendRequest('http://localhost:8000/servo/close/$key')\">Close</a></td>
        </tr>\n";
}
?>
            </tbody>
        </table>
    </div>
</div>

<script>
function sendRequest(url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.send();
}
</script>