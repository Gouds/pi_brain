<html>
    <head>
        <title>R2 Brain</title>   
        <link rel="stylesheet" type="text/css" href="css/style.css"/>
        <script src="javascript/sidemenu.js"></script>
        <script src="javascript/volume.js"></script>
    </head>
    <?php $page = $_GET['page']; $page = $page ?? 'home'; ?>

    <body id="body" class="<?php echo file_get_contents('theme.txt'); ?>">
        <div class="wrapper">
            <?php include("include/header.php"); ?>
            <div class="contentwrapper">
                <sidemenu id="leftsidemenu" class="show">
                    <?php include("include/sidemenu.php"); ?>
                </sidemenu>
                <div class="content">
                    <?php include($page . ".php"); ?>
                </div>
                <sidemenu id="rightsidemenu">
                <?php include("include/sidemenu.php"); ?>
                </sidemenu>
            </div>
            <?php include("include/footer.php"); ?>
        </div>
    </body>
</html>