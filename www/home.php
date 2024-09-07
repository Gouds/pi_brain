<?php include("config.php"); 
?>

    <style>
        .pagewrapper {
            position: relative;
            height: 400px;
        }
        #homeImage {
            position: absolute;
            right: 0;
            bottom: 5px;
        }
        #serverStatus {
            color: white;
            padding: 5px;
        }
        .online {
            background-color: green;
        }
        .offline {
            background-color: red;
        }
    </style>


<div class="pagewrapper">
    <h1>Welcome to Pi Brain.</h1>
    <p>Power on:</p>
    <ul>
        <li>Audio</li>
        <li>Motors</li>
        <li>HoloProjectors</li>
        <li>Lights</li>
    </ul>
    <!-- Other content -->
    <img id="homeImage" src="/images/home_r2.png">
    <div id="serverStatus" class="offline">Checking server status...</div>
</div>
<script>
    function checkServerStatus() {
        var siteUrl = "<?php echo $site_url; ?>/health"; // Use the PHP variable here
        fetch(siteUrl)  // Use the siteUrl variable
            .then(response => {
                if (response.ok) {
                    document.getElementById('serverStatus').className = 'online';
                    document.getElementById('serverStatus').textContent = 'Server Online';
                } else {
                    throw new Error('Server responded with non-OK status');
                }
            })
            .catch(error => {
                console.error('Error checking server status:', error);
                document.getElementById('serverStatus').className = 'offline';
                document.getElementById('serverStatus').textContent = 'Server Offline';
            });
    }

    // Check server status on page load
    checkServerStatus();

    // Actively monitor the server status every 5 seconds
    setInterval(checkServerStatus, 5000);
</script>

