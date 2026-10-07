/*
    QuickChat
    GitHub Pages용 초간단 P2P 채팅

    서버 / DB 없음
*/


let peer = null;

let connections = [];

let myName = "";

let isHost = false;

let hostConnection = null;

let messageHistory = [];


// 화면
const loginScreen = document.getElementById("loginScreen");
const chatScreen = document.getElementById("chatScreen");

const nameInput = document.getElementById("nameInput");
const joinButton = document.getElementById("joinButton");

const statusText = document.getElementById("status");

const messages = document.getElementById("messages");

const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");

const onlineCount = document.getElementById("onlineCount");


// ========================================
// 채팅방 ID
// ========================================

function makeRoomId() {

    const text =
        location.hostname +
        location.pathname;

    let hash = 0;

    for (let i = 0; i < text.length; i++) {

        hash =
            ((hash << 5) - hash) +
            text.charCodeAt(i);

        hash |= 0;
    }

    hash = Math.abs(hash);

    return "quickchat-" + hash;
}

const ROOM_ID = makeRoomId();


// ========================================
// Peer 시작
// ========================================

function createPeer() {

    statusText.textContent = "채팅방에 연결 중...";

    peer = new Peer(ROOM_ID);

    peer.on("open", () => {

        /*
            방 ID를 먼저 차지했다면
            내가 현재 방의 호스트
        */

        isHost = true;

        statusText.textContent =
            "채팅방을 만들었습니다.";

    });


    /*
        이미 방이 존재하면
        ID 충돌 발생

        → 기존 방에 참가
    */

    peer.on("error", (error) => {

        if (error.type === "unavailable-id") {

            isHost = false;

            peer.destroy();

            connectToHost();

            return;
        }

        console.error(error);

        statusText.textContent =
            "연결에 실패했습니다.";
    });


    /*
        다른 사용자가 나에게 연결
        → 내가 호스트
    */

    peer.on("connection", (connection) => {

        if (!isHost) return;

        setupHostConnection(connection);

    });
}


// ========================================
// 기존 방 참가
// ========================================

function connectToHost() {

    statusText.textContent =
        "기존 채팅방에 참가 중...";

    peer = new Peer();

    peer.on("open", () => {

        hostConnection =
            peer.connect(ROOM_ID);

        setupClientConnection(hostConnection);

    });


    peer.on("error", (error) => {

        console.error(error);

        statusText.textContent =
            "채팅방에 연결할 수 없습니다.";
    });
}


// ========================================
// 호스트 연결
// ========================================

function setupHostConnection(connection) {

    connections.push(connection);

    connection.on("open", () => {

        /*
            새로 들어온 사람에게
            기존 채팅 기록 전달
        */

        connection.send({
            type: "history",
            messages: messageHistory
        });


        /*
            현재 접속자 수
        */

        broadcastCount();

    });


    connection.on("data", (data) => {

        if (!data) return;


        if (data.type === "join") {

            addSystemMessage(
                `${data.name}님이 입장했습니다.`
            );

            broadcast({
                type: "system",
                text: `${data.name}님이 입장했습니다.`
            });

            return;
        }


        if (data.type === "message") {

            const message = {
                name: data.name,
                text: data.text
            };

            /*
                호스트에도 저장
            */

            messageHistory.push(message);


            /*
                화면 표시
            */

            displayMessage(
                message.name,
                message.text
            );


            /*
                다른 사람들에게 전달
            */

            broadcast({
                type: "message",
                name: message.name,
                text: message.text
            });

        }

    });


    connection.on("close", () => {

        connections =
            connections.filter(
                c => c !== connection
            );

        broadcastCount();

    });

}


// ========================================
// 일반 참가자
// ========================================

function setupClientConnection(connection) {

    connection.on("open", () => {

        statusText.textContent =
            "채팅방에 연결되었습니다.";

        /*
            이름 전달
        */

        connection.send({
            type: "join",
            name: myName
        });

        enterChat();

    });


    connection.on("data", (data) => {

        if (!data) return;


        /*
            기존 기록
        */

        if (data.type === "history") {

            data.messages.forEach(message => {

                displayMessage(
                    message.name,
                    message.text
                );

            });

            return;
        }


        /*
            새 메시지
        */

        if (data.type === "message") {

            displayMessage(
                data.name,
                data.text
            );

            return;
        }


        /*
            시스템 메시지
        */

        if (data.type === "system") {

            addSystemMessage(
                data.text
            );

        }

    });


    connection.on("close", () => {

        addSystemMessage(
            "채팅방 연결이 종료되었습니다."
        );

    });

}


// ========================================
// 메시지 전체 전송
// ========================================

function broadcast(data) {

    connections.forEach(connection => {

        if (connection.open) {

            connection.send(data);

        }

    });

}


// ========================================
// 접속자 수
// ========================================

function broadcastCount() {

    const count =
        connections.length + 1;

    onlineCount.textContent = count;

    broadcast({
        type: "count",
        count
    });

}


// ========================================
// 채팅 입장
// ========================================

function enterChat() {

    loginScreen.classList.add("hidden");

    chatScreen.classList.remove("hidden");

    messageInput.focus();

}


// ========================================
// 이름 입력
// ========================================

function joinChat() {

    const name =
        nameInput.value.trim();

    if (!name) {

        alert("이름을 입력해주세요.");

        nameInput.focus();

        return;
    }

    myName =
        name.substring(0, 20);

    joinButton.disabled = true;

    createPeer();

}


// 버튼

joinButton.addEventListener(
    "click",
    joinChat
);


// 엔터

nameInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            joinChat();

        }

    }
);


// ========================================
// 메시지 보내기
// ========================================

messageForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        const text =
            messageInput.value.trim();

        if (!text) return;

        const message = {
            type: "message",
            name: myName,
            text: text.substring(0, 500)
        };


        /*
            내가 호스트
        */

        if (isHost) {

            messageHistory.push({
                name: myName,
                text: message.text
            });


            displayMessage(
                myName,
                message.text
            );


            broadcast(message);

        }


        /*
            내가 참가자
        */

        else if (
            hostConnection &&
            hostConnection.open
        ) {

            hostConnection.send(message);

        }


        messageInput.value = "";

        messageInput.focus();

    }
);


// ========================================
// 메시지 화면 표시
// ========================================

function displayMessage(name, text) {

    const element =
        document.createElement("div");

    element.className =
        "message";


    if (name === myName) {

        element.classList.add("mine");

    }


    const nameElement =
        document.createElement("div");

    nameElement.className =
        "message-name";

    nameElement.textContent =
        name;


    const textElement =
        document.createElement("div");

    textElement.className =
        "message-text";

    /*
        innerHTML이 아니라 textContent 사용
        → HTML 코드가 실행되지 않음
    */

    textElement.textContent =
        text;


    element.appendChild(
        nameElement
    );

    element.appendChild(
        textElement
    );

    messages.appendChild(
        element
    );


    scrollBottom();

}


// ========================================
// 시스템 메시지
// ========================================

function addSystemMessage(text) {

    const element =
        document.createElement("div");

    element.className =
        "system-message";

    element.textContent =
        text;

    messages.appendChild(
        element
    );

    scrollBottom();

}


// ========================================
// 스크롤
// ========================================

function scrollBottom() {

    messages.scrollTop =
        messages.scrollHeight;

}
