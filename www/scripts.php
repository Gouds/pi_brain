<?php

include("config.php");

$play = $_GET["play"];
$loop = $_GET["loop"];
$stop = $_GET["stop"];

if(!isset($loop)) {
   $loop = 0;
}

if(isset($stop)) {
    if ($stop == "all") {
        echo "Stopping all scripts...<br />\n";
        $url = "$site_url/script/stop_all";
    } else {
        echo "Stopping... $stop<br />\n";
        $url = "$site_url/script/stop/".$stop;
    }
    $handle = fopen($url, "r");
}


if(isset($play)) {
   echo "<p class='flexrow'>Playing&hellip; $play</p>\n";
   $url = "$site_url/script/start/".$play."/".$loop;
   $handle = fopen($url, "r");
}

// Display running scripts
$url = "$site_url/script/list_running";
$running_scripts_json = file_get_contents($url);
$running_scripts = json_decode($running_scripts_json, true);
echo "<div class=items>";
echo "<h2>Running Scripts</h2>";
foreach ($running_scripts['running_scripts'] as $id => $script_details) {
   $name = $script_details['script_name'];
   echo "<div class=item>";
   echo $name;
   echo " <a href=\"?page=scripts&stop=".$id."\">Stop</a>";
   echo "</div>";
}
echo "</div>";

$url = "$site_url/script/list/";
$fh = fopen($url, "r");
$files = str_getcsv(str_replace(" ", "", stream_get_contents($fh)), ",");
sort($files);
$num_files=sizeof($files);

echo "<div class=items>";
echo "<h2>All Scripts</h2>";
echo "<div class=item><a href=\"?page=scripts&stop=all\">Stop All</a></div>";
for ($i = 0 ; $i < $num_files ; $i++) {
   $files[$i] = trim($files[$i], '[]"');  // Remove [ and " from the item
   $files[$i] = str_replace('.scr', '', $files[$i]);  // Remove .scr from the item
   echo "<div class=item>";
   echo $files[$i];
   echo " <a href=\"?page=scripts&play=".$files[$i]."&loop=0\">Play Once</a>";
   echo " <a href=\"?page=scripts&play=".$files[$i]."&loop=1\">Loop</a>";
   echo "</div>";
}
echo "</div>";