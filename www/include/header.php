<?php $style = file_get_contents('theme.txt'); ?>
<header>
    <div class="leftheader">
        
    </div>
    <div class="header">
        <h1>R2 Brain - <?php echo $page ?></h1>
    </div>
    <div class="rightheader">
        <a onclick="toggleMenu();">
            <img id="menuButton" src="images/menuicon.png" width="44" height="44" alt="Toggle Menu">
        </a>
        <a href="#" onclick="location.reload();">
            <img src="images/refresh.png" width="44" height="44" alt="Refresh Page">
        </a>
    </div>
</header>