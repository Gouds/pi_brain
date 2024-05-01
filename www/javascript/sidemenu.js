var menuState = 0; // 0: Both hidden, 1: Left visible, 2: Right visible

        function toggleMenu() {
            var leftsidemenu = document.getElementById("leftsidemenu");
            var rightsidemenu = document.getElementById("rightsidemenu");
            var menuButton = document.getElementById("menuButton");

            // Directly toggle the menu state without checking the current state
            menuState = (menuState + 1) % 3;

            // Update menu button icon based on state
            updateMenuButtonIcon();

            if (menuState === 0) {
                // Show left menu
                leftsidemenu.style.display = "block";
                rightsidemenu.style.display = "none";
                menuState = 1;
            } else if (menuState === 1) {
                // Show right menu
                leftsidemenu.style.display = "none";
                rightsidemenu.style.display = "block";
                menuState = 2;
            } else {
                // Hide both menus
                leftsidemenu.style.display = "none";
                rightsidemenu.style.display = "none";
                menuState = 0;
            }

            // Update menu button icon based on state
            updateMenuButtonIcon();
        }

        function updateMenuButtonIcon() {
            var menuButton = document.getElementById("menuButton");
            var icon = "";
            if (menuState === 0) {
                icon = "icon_menu";
            } else if (menuState === 1) {
                icon = "icon_menu";
            } else {
                icon = "icon_menu";
            }
            menuButton.src = "images/" + icon + ".png";
        }