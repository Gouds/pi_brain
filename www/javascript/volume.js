
    // Open the volume popup
    function openVolumePopup() {
        document.getElementById('volumePopup').style.display = 'block';
    }

    // Close the volume popup
    function closeVolumePopup() {
        document.getElementById('volumePopup').style.display = 'none';
    }

    // Function to get the current volume from the FastAPI server
    function getCurrentVolume() {
        console.log('Fetching current volume...');
        fetch(site_url + '/volume')
            .then(response => {
                console.log('Response status:', response.status);
                if (!response.ok) {
                    throw new Error('Failed to get current volume. Server returned status: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                console.log('Response data:', data);
                // Update the volume slider with the current volume
                document.getElementById('volumeSlider').value = data;
            })
            .catch(error => {
                console.error('Error getting current volume:', error);
            });
    }

    // Call getCurrentVolume function when the DOM content is loaded
    document.addEventListener("DOMContentLoaded", getCurrentVolume);

    // Function to set the volume
    function setVolume(volume) {
        // Send a request to the FastAPI server to update the volume
        fetch(site_url + '/volume/' + volume, { method: 'PUT' })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to update volume');
                }
                console.log('Volume updated successfully');
            })
            .catch(error => {
                console.error('Error updating volume:', error);
            });
    }
