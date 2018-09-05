(() => {
    //  setup video frame
    const video = document.getElementById('webcam');
    const ctrack = new clm.tracker();
    ctrack.init();

    const overlay = document.getElementById('overlay');
    const overlayCC = overlay.getContext('2d');

    const trackingLoop = () => {
        requestAnimationFrame(trackingLoop);

        let currentPosition = ctrack.getCurrentPosition();
        overlayCC.clearRect(0, 0, 400, 300);

        if (currentPosition) {
            ctrack.draw(overlay);
        }
    }

    const onStreaming = (stream) => {
        video.srcObject = stream;
        ctrack.start(video);
        trackingLoop();
    }

    //  get user permission for webcam access
    navigator.mediaDevices.getUserMedia({ video: true }).then(onStreaming);

})();