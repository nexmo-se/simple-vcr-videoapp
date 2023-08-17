// Essential variables
var userName, roomName;
var apiKey, sessionId, token, roomId;
var experienceComposer;
var veRoom;

var videoOn = "ON", audioOn = "ON", screenShareOngoing = "false";

// --------------------

async function init() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    userName = urlParams.get('userName');
    roomName = urlParams.get('roomName');
    console.log("init() ::: ", { userName, roomName });

    if (userName && roomName) {
        await login();
    } else {
        document.getElementById("login").classList.remove("hide");
    }
}
init();

async function login() {
    try {
        if (!userName || !roomName) {
            const nameElem = document.getElementById("userName");
            const roomElem = document.getElementById("roomName");
            userName = nameElem.value;
            roomName = roomElem.value;

            console.log("login() ::: ", { userName, roomName });
        }

        document.getElementById("login-button").classList.add("hide");
        document.getElementById("login-loader").classList.remove("hide");
    
        let result = await axios.post(`/init`, {
            name: userName,
            roomName
        });
        console.log(`/init | `, result);
        if (result.status === 200) {
            apiKey = result.data ? result.data.apiKey : "";
            sessionId = result.data ? result.data.sessionId : "";
            token = result.data ? result.data.token : "";
            roomName = result.data ? result.data.roomName : "";
            roomId = result.data ? result.data.roomId : "";

            // start video call
            await initializeSession();

            // update UI
            await hideLogin();
            await checkScreenShareButton();
        } else {
            document.getElementById("login-button").classList.remove("hide");
            document.getElementById("login-loader").classList.add("hide");
            await handleError(result);
        }
    } catch(error) {
        document.getElementById("login-button").classList.remove("hide");
        document.getElementById("login-loader").classList.add("hide");
        await handleError(error);
    }
}

async function hideLogin() {
    document.getElementById("login").classList.add("hide");
    document.getElementById("login-button").classList.remove("hide");
    document.getElementById("login-loader").classList.add("hide");
    document.getElementById("controls").classList.remove("hide");
}

async function checkScreenShareButton() {
    let isMobile = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) isMobile = true;})(navigator.userAgent||navigator.vendor||window.opera);
    
    if (isMobile) {
        document.getElementById("screen-share").classList.add("hide");
        document.getElementById("vonage-logo").classList.add("hide");
    } else {
        document.getElementById("change-publish-audio").classList.add("hide");
    }
}

// --------------------

async function videoToggle() {
    let prevVideoOn = videoOn;
    videoOn = videoOn === "ON" ? "OFF" : "ON";
    if(videoOn === "ON" ? veRoom.camera.enableVideo() : veRoom.camera.disableVideo());

    document.getElementById(`video-${videoOn.toLowerCase()}`).classList.remove("hide");
    document.getElementById(`video-${prevVideoOn.toLowerCase()}`).classList.add("hide");
}

async function audioToggle() {
    let prevAudioOn = audioOn;
    audioOn = audioOn === "ON" ? "OFF" : "ON";
    if(audioOn === "ON" ? veRoom.camera.enableAudio() : veRoom.camera.disableAudio());

    document.getElementById(`audio-${audioOn.toLowerCase()}`).classList.remove("hide");
    document.getElementById(`audio-${prevAudioOn.toLowerCase()}`).classList.add("hide");
}

async function screenShareToggle() {
    let prevScreenShareOngoing = screenShareOngoing;
    screenShareOngoing = screenShareOngoing === "true" ? "false" : "true";
    document.getElementById(`screen-share-${screenShareOngoing.toLowerCase()}`).classList.remove("hide");
    document.getElementById(`screen-share-${prevScreenShareOngoing.toLowerCase()}`).classList.add("hide");
    
    if (screenShareOngoing === "true") {
        veRoom.startScreensharing()
            .then(() => console.log('Started screen sharing'))
            .catch((err) => handleError(err));
    } else {
        veRoom.stopScreensharing();
    }
}

// --------------------

// Handling all of our errors here by alerting them
function handleError(error) {
    if (error) {
        console.error('handleError error', error);
        alert(error.message ? error.message : error);
    }
}

async function createInitials(string) {
    let strArr = string.split(" ");
    if (strArr.length === 0) return "";
    else if (strArr.length === 1) return strArr[0][0].toUpperCase();
    else return strArr[0][0].toUpperCase() + strArr[1][0].toUpperCase();
}

async function initializeSession() {
    veRoom = new VideoExpress.Room({
        apiKey, sessionId, token,
        participantName: userName,
        participantInitials: await createInitials(userName),
        roomContainer: "roomContainer",
        managedLayoutOptions: {
            layoutMode: "grid",
            speakerHighlightEnabled: true,
            speakerHighlightColor: "#861dfe"
        }
    });
    console.log("initializeSession", { veRoom });

    veRoom.join();

    veRoom.on('connected', () => {
        console.log('VE Room Connected');
    });

    veRoom.on('*', (participant) => {
        console.log('EVENT: ', participant);
    });

    veRoom.camera.on('*', (data) => {
        console.log('CAM EVENT: ', data);
    });
}

// --------------------