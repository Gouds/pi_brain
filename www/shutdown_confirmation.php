<?php
include("config.php");

// Send request to FastAPI server to trigger Raspberry Pi shutdown
$shutdown_url = "$site_url/shutdown"; // Change this if your FastAPI server runs on a different host or port
$response = file_get_contents($shutdown_url);
echo "Shutdown command sent to Raspberry Pi.";
?>


shutdown_confirmation