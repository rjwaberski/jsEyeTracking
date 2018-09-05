const KEY = {
    SPACE: 32
};

(() => {
    //  setup video frame
    const video = document.getElementById('webcam');
    const ctrack = new clm.tracker();
    ctrack.init();

    const overlay = document.getElementById('overlay');
    const overlayCC = overlay.getContext('2d');

    const eyesCanvas = document.getElementById('eyes');
    const eyesCC = eyesCanvas.getContext('2d');

    const trackingLoop = () => {
        requestAnimationFrame(trackingLoop);

        let currentPosition = ctrack.getCurrentPosition();
        overlayCC.clearRect(0, 0, 400, 300);

        if (currentPosition) {
            ctrack.draw(overlay);

            const eyesRect = getEyesRectangle(currentPosition);
            overlayCC.strokeStyle = 'red';
            overlayCC.strokeRect(eyesRect[0], eyesRect[1], eyesRect[2], eyesRect[3]);

            const resizeFactorX = video.videoWidth / video.width;
            const resizeFactorY = video.videoHeight / video.height;

            eyesCC.drawImage(
                video,
                eyesRect[0] * resizeFactorX, eyesRect[1] * resizeFactorY,
                eyesRect[2] * resizeFactorX, eyesRect[3] * resizeFactorY,
                0, 0, eyesCanvas.width, eyesCanvas.height
            )
        }
    }

    const onStreaming = (stream) => {
        video.srcObject = stream;
        ctrack.start(video);
        trackingLoop();
    }

    const getEyesRectangle = (positions) => {
        const minX = positions[23][0] - 5;
        const maxX = positions[28][0] + 5;
        const minY = positions[24][1] - 5;
        const maxY = positions[26][1] + 5;

        const width = maxX - minX;
        const height = maxY - minY;

        return [minX, minY, width, height];
    }

    const mouse = {
        x: 0,
        y: 0,
        handleMouseMove: (event) => {
            mouse.x = (event.clientX / window.width) * 2 - 1;
            mouse.y = (event.clientY / window.height) * 2 - 1;
        }
    }

    const getImage = () => {
        return tf.tidy(() => {
            const image = tf.fromPixels(eyesCanvas);
            const batchedImage = image.expandDims(0);
            return batchedImage.toFloat().div(tf.scalar(127)).sub(tf.scalar(1));
        })
    }

    const dataset = {
        train: {
            n: 0,
            x: null,
            y: null
        },
        val: {
            n: 0,
            x: null,
            y: null
        }
    }

    const captureExample = () => {
        tf.tidy(() => {
            const image = getImage();
            const mousePos = tf.tensor1d([mouse.x, mouse.y]).expandDims(0);

            const subset = dataset[Math.random() > 0.2 ? 'train' : 'val'];

            if (subset.x == null) {
                subset.x = tf.keep(image);
                subset.y = tf.keep(mousePos);
            } else {
                const oldX = subset.x;
                const oldY = subset.y;

                subset.x = tf.keep(oldX.concat(image, 0));
                subset.y = tf.keep(oldY.concat(mousePos, 0));
            }

            subset.n += 1;
        })
    }

    //  get user permission for webcam access
    navigator.mediaDevices.getUserMedia({ video: true }).then(onStreaming);

    document.onmousemove = mouse.handleMouseMove;
    document.body.onkeyup = (event) => {
        debugger;
        if (event.keyCode == KEY.SPACE) {
            captureExample();
            event.preventDefault();
            return false;
        }
    }
})();