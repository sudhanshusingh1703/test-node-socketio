
var userId = localStorage.getItem("userId") || randomId();

var userVideo = document.getElementById('user-video');
var peerVideo = document.getElementById('peer-video');
var userStream;

localStorage.setItem("userId",userId);
console.info("Hi I'm user #" + userId);

var messageCache;
navigator.getUserMedia = navigator.getUserMedia || navigator.webKitGetUserMedia || navigator.mozGetUserMedia; 

function randomId(){
    return Math.floor(Math.random() * 1e11)
}

var socket = io.connect('http://localhost', {'forceNew':true});
socket.on("get-media", function(){
    navigator.getUserMedia(
        {
            audio: true,
            video:{ width: 1280, height: 720 }
        },
        function(stream){ // user video stream
            userStream = stream;
            // console.log("Stream : " + stream);
            // console.log("Stream : " + userVideo);
            // videoChatForm.style = "display:none";
            // divBtnGroup.style = "display:flex";
            userVideo.srcObject = stream;
            userVideo.onloadedmetadata = function(e){
                userVideo.play();
            }
            socket.emit("broadcast-stream", stream);
        },
        function(error){
            alert("You can't access Media: " + error);
        });
});
socket.on("messages", function(data){
    console.info(data)
    messageCache = data;
    render(); 
    
});

socket.on("streams", function(data){
    console.info("streams: " + data);
    console.info("streams type: " + data);
    for(const i in data){
        console.info("streams type: " + i);
    }

    // data.forEach((d) => {
    //         console.log(d);
    //   });
    
    //messageCache = data;
    // userVideo.srcObject = data;
    // userVideo.play();
    var userStream;
    if(navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({audio: true, video:true}).then(function(stream) {
               console.log("got the stream");
               //userVideo.srcObject = data;
               userStream = stream;
               peerVideo.srcObject = userStream;
     
               });
                   }

    render(); 
    
});

function render(){
    var data = messageCache;
    var html = data.sort(function(a,b){
        return a.ts - b.ts;
    }).map(function(data, index){
        return (`
            <form class="message" onsubmit="return likeMessage(messageCache[${index}])">
                <div class='name'>
                    ${data.userName}
                </div>
                <a href=${data.content.link} class='message' target=blank>
                    ${data.content.text}
                </a>
                <div class=time>${moment(data.ts).fromNow()} </div>
                <input type=submit class="likes-count" value="${data.likedBy.length} Likes">
            </form>
        `)
    }).join(" ");
    document.getElementById("messages").innerHTML = html;
}

function likeMessage(message){
    var index = message.likedBy.indexOf(userId);
    if(index < 0){
        message.likedBy.push(userId);
    } else {
        message.likedBy.splice(index,1);
    }

    socket.emit("update-message", message);
    render();
    return false;

}

function addMessage(e){
    var payload = {
            messageId : randomId(),
            userName: document.getElementById("username").value,
            content: {
                text: document.getElementById("message").value,
                link: document.getElementById("linkAddress").value
            },
            likedBy: [],
            ts: Date.now()
    }

    socket.emit("new-message", payload);
    return false;
}