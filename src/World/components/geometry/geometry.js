const MAX_WIDTH = 1280;
const FOCAL_LENGTH = 1430;
const DFOV = Math.PI / 3;

const parameter = (location.search.split('distanceMethod=')[1] || '').split('&')[0]
const distanceMethod = parameter ? parameter : 0;
const DEFAULT_DISTANCE = 0.5;

const IRIS_SIZE = 0.0117;
const NUM_KEYPOINTS = 468;
const NUM_IRIS_KEYPOINTS = 5;
const SMOOTHING = 0;
const TOLERANCE = 0.01;

const HALF_DIAGONAL = 0.2;

let model, HFOV, VFOV;
let canvas, video;
let width, height;

function distance(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

function fov(dfov, w, h) {
    const hypothenuse = Math.sqrt(Math.pow(w, 2) + Math.pow(h, 2));
    const tan_dfov = Math.tan(dfov / 2);
    return [2 * Math.atan(w * tan_dfov / hypothenuse), 2 * Math.atan(h * tan_dfov / hypothenuse)];
}

async function getLocation(ctx, width, height) {
    const predictions = await model.estimateFaces({
        input: ctx.getImageData(0, 0, width, height),
        flipHorizontal: false
    });

    if (predictions.length > 0) {
        const keypoints = predictions[0].scaledMesh;
        let centerX = keypoints[168][0];
        let centerY = keypoints[168][1];

        let foreheadX = keypoints[10][0];
        let foreheadY = keypoints[10][1];

        let d;
        if (distanceMethod == 0) {
            d = DEFAULT_DISTANCE;
        } else if (distanceMethod == 2) {
            d = 0.06 * FOCAL_LENGTH * canvas.width / MAX_WIDTH / Math.sqrt(Math.pow(centerX - foreheadX, 2) + Math.pow(centerY - foreheadY, 2));
        } else if (keypoints.length > NUM_KEYPOINTS) {
            const leftDiameterY = distance(
                keypoints[NUM_KEYPOINTS + 4],
                keypoints[NUM_KEYPOINTS + 2]);
            const leftDiameterX = distance(
                keypoints[NUM_KEYPOINTS + 3],
                keypoints[NUM_KEYPOINTS + 1]);
            let diameter = Math.max(leftDiameterX, leftDiameterY);

            if (keypoints.length > NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS) {
                const rightDiameterY = distance(
                    keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 2],
                    keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 4]);
                const rightDiameterX = distance(
                    keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 3],
                    keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 1]);
                diameter = Math.max(diameter, rightDiameterX, rightDiameterY);
            }
            d = IRIS_SIZE * FOCAL_LENGTH * canvas.width / MAX_WIDTH / diameter;
        }
        return [Math.atan((centerX - canvas.width / 2) / canvas.width * Math.tan(HFOV)),
            Math.atan((centerY - canvas.height / 2) / canvas.height * Math.tan(VFOV)),
            d
        ]

    }
    return null;
}

class FaceTracker {
    constructor(container) {
        this.angle1 = 0;
        this.angle2 = 0;
        this.distance = 0;
        this.deltaD = 0;
        this.step = 1;
        this.lastTimestamp = Date.now();
    }

    async init() {
        await tf.setBackend('webgl');
        model = await faceLandmarksDetection.load(
            faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, {
                maxFaces: 1
            });
        if (navigator.mediaDevices.getUserMedia) {
            video = document.querySelector('#video');
            await navigator.mediaDevices.getUserMedia({
                    video
                })
                .then(function (stream) {
                    video.srcObject = stream;
                    width = stream.getTracks()[0].getSettings().width;
                    height = stream.getTracks()[0].getSettings().height;
                    [HFOV, VFOV] = fov(DFOV, width, height);
                })
                // permission denied:
                .catch(function (error) {
                    document.body.textContent = 'Could not access the camera. Error: ' + error.name;
                });
        }
        canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        video.addEventListener('click', this.locateFace);
    }

    async getCameraParameters(outputWidth, outputHeight) {
        let context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, width, height);
        const result = await getLocation(context, width, height);
        if (result !== null) {
            const [angle1, angle2, distance] = result;
            this.angle1 = angle1;
            this.angle2 = angle2;
            let correctedDistance;
            if (this.step == 1) {
                correctedDistance = distance;
            } else if (distance - this.distance > this.deltaD + TOLERANCE) {
                correctedDistance = this.distance + this.deltaD + TOLERANCE;
            } else if (distance - this.distance < this.deltaD - TOLERANCE) {
                correctedDistance = this.distance + this.deltaD - TOLERANCE;
            } else {
                correctedDistance = distance;
            }
            this.distance = (1 - SMOOTHING) * correctedDistance + SMOOTHING * this.distance;
            if (this.step <= 10) {
                this.distance = this.distance / (1 - Math.pow(SMOOTHING, this.step))
            }
            this.deltaD = correctedDistance - this.distance;
            this.lastTimestamp = Date.now();
            this.step = this.step + 1;
        } else {
            return null;
        }
        let d = this.distance;
        const tan1 = -Math.tan(this.angle1 / 2);
        const tan2 = -Math.tan(this.angle2 / 2);
        const z = Math.sqrt(d * d / (1 + tan1 * tan1 + tan2 * tan2))
        const cameraPosition = [z * tan1, z * tan2, z];
        const fov = 180 / Math.PI * 2 * Math.atan(HALF_DIAGONAL / d);
        return [cameraPosition, fov];
    }
}

export {
    FaceTracker
};