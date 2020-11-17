importScripts("https://unpkg.com/@tensorflow/tfjs-core@2.4.0/dist/tf-core.js");
importScripts("https://unpkg.com/@tensorflow/tfjs-converter@2.4.0/dist/tf-converter.js");
importScripts("https://unpkg.com/@tensorflow/tfjs-backend-webgl@2.4.0/dist/tf-backend-webgl.js");
importScripts("https://unpkg.com/@tensorflow-models/face-landmarks-detection@0.0.1/dist/face-landmarks-detection.js");

const MAX_WIDTH = 1280;
const FOCAL_LENGTH = 1430;
const DEFAULT_DISTANCE = 0.5;
const IRIS_SIZE = 0.0117;
const NUM_KEYPOINTS = 468;
const NUM_IRIS_KEYPOINTS = 5;
const HALF_DIAGONAL = 0.2;
let model;

async function setup() {
    await tf.setBackend('webgl');
    model = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, {
            maxFaces: 1
        });
}

self.onmessage = async function (msg) {
    if (!model) {
        await setup();
    }
    const imageData = msg.data['imageData'];
    const width = msg.data['width'];
    const height = msg.data['height'];
    const distanceMethod = msg.data['distanceMethod'];
    const HFOV = msg.data['hfov'];
    const VFOV = msg.data['vfov'];
    const predictions = await model.estimateFaces({
        input: imageData,
        flipHorizontal: false
    });

    if (predictions.length > 0) {
        const keypoints = predictions[0].scaledMesh;
        let centerX = keypoints[168][0];
        let centerY = keypoints[168][1];
        let d;
        if (distanceMethod == 0) {
            d = DEFAULT_DISTANCE;
        } else if (distanceMethod == 2) {
            let foreheadX = keypoints[10][0];
            let foreheadY = keypoints[10][1];
            d = 0.06 * FOCAL_LENGTH * width / MAX_WIDTH / Math.sqrt(Math.pow(centerX - foreheadX, 2) + Math.pow(centerY - foreheadY, 2));
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
            d = IRIS_SIZE * FOCAL_LENGTH * width / MAX_WIDTH / diameter;
        }
        self.postMessage({
            'result': [Math.atan(2 * (centerX - width / 2) / width * Math.tan(HFOV / 2)),
                Math.atan(2 * (centerY - height / 2) / height * Math.tan(VFOV / 2)),
                d
            ]
        });
    } else {
        self.postMessage({
            'result': null
        });
    }
}