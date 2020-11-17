const DFOV = Math.PI / 3;

const parameter = (location.search.split('distanceMethod=')[1] || '').split('&')[0]
const distanceMethod = parameter ? parameter : 0;

const SMOOTHING = 0;
const TOLERANCE = 0.01;

const HALF_DIAGONAL = 0.2;

let model, HFOV, VFOV;
let canvas, video;
let width, height;

function fov(dfov, w, h) {
    const hypothenuse = Math.sqrt(Math.pow(w, 2) + Math.pow(h, 2));
    const tan_dfov = Math.tan(dfov / 2);
    return [2 * Math.atan(w * tan_dfov / hypothenuse), 2 * Math.atan(h * tan_dfov / hypothenuse)];
}

class FaceTracker {
    constructor(container) {
        this.angle1 = 0;
        this.angle2 = 0;
        this.distance = 0;
        this.deltaD = 0;
        this.step = 1;
        this.face = false;
        this.lastTimestamp = Date.now();
    }

    launchWorker() {
        let context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, width, height);
        const input = {
            'imageData': context.getImageData(0, 0, width, height),
            'width': width,
            'height': height,
            'hfov': HFOV,
            'vfov': VFOV,
            'distanceMethod': distanceMethod
        };
        this.worker.postMessage(input);
    }

    async init() {
        model = await faceLandmarksDetection.load(
            faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, {
                maxFaces: 1
            });
        if (navigator.mediaDevices.getUserMedia) {
            video = document.querySelector('#video');
            await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'user'
                    }
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
        this.worker = new Worker('./src/World/components/geometry/worker.js');
        this.worker.addEventListener('message', this.handleMessageFromWorker.bind(this));
        this.launchWorker();
    }

    handleMessageFromWorker(msg) {
        if (msg.data['result'] !== null) {
            const [angle1, angle2, distance] = msg.data['result'];
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
            this.face = true;
        } else {
            this.face = false;
        }
        this.launchWorker();
    }

    async getCameraParameters() {
        if (this.face) {
            let d = this.distance;
            const tan1 = -Math.tan(this.angle1);
            const tan2 = -Math.tan(this.angle2);
            const z = Math.sqrt(d * d / (1 + tan1 * tan1 + tan2 * tan2))
            const cameraPosition = [z * tan1, z * tan2, z];
            const fov = 180 / Math.PI * 2 * Math.atan(HALF_DIAGONAL / d);
            return [cameraPosition, fov];
        } else {
            return null;
        }
    }
}

export {
    FaceTracker
};