<?php 
include("config.php");
$style = file_get_contents('theme.txt'); 
?>

<header>
    <div class="leftheader">
        
    </div>
    <div class="header">
        <h1>R2 Brain - <?php echo $page ?></h1>
    </div>
    <div class="rightheader">
        <a onclick="toggleMenu();">
            <img id="menuButton" src="images/icon-menu.png" width="44" height="44" alt="Toggle Menu">
        </a>
        <a onclick="openVolumePopup();">
            <img id="volumeButton" src="images/icon-volume.png" width="44" height="44" alt="Volume">
        </a>
        <a href="#" onclick="location.reload();">
            <img src="images/icon-refresh.png" width="44" height="44" alt="Refresh Page">
        </a>
    </div>
</header>

<script>
    var site_url = "<?php echo $site_url; ?>";
</script>

<!-- Volume Popup -->
<div id="volumePopup" class="popup">
    <span class="close" onclick="closeVolumePopup()">&times;</span>
    <div class=volhead>Volume</div>
    <input type="range" min="0" max="100" value="50" id="volumeSlider" onchange="setVolume(this.value)">
</div>




