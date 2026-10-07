import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getDatabase,
    ref,
    push,
    onChildAdded,
    onValue,
    onDisconnect,
    set,
    remove
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";


/* =====================================
   Firebase 설정
===================================== */

const firebaseConfig = {
  apiKey: "AIzaSyCKLoiguWM3dFiONfFJmqEpnF3FqqQqNy4",
  authDomain: "quickchat-41dfe.firebaseapp.com",
  projectId: "quickchat-41dfe",
  storageBucket: "quickchat-41dfe.firebasestorage.app",
  messagingSenderId: "359008206347",
  appId: "1:359008206347:web:c5e9c925928d47b857d10e",
  measurementId: "G-3F3K5DCPEV"
};


const app = initializeApp(firebaseConfig);

const db = getDatabase(app);


/* =====================================
   기본 설정
===================================== */

/*
    같은 GitHub Pages 주소 = 같은 채팅방

    예:
    https://example.github.io/QuickChat/

    이 주소에 들어온 사람들은
    모두 같은 방을 사용한다.
*/

const roomId = "main-room";

const roomRef = ref(
    db,
    "rooms/" + roomId
);


/* =====================================
   화면
===================================== */

const loginScreen =
    document.getElementById("loginScreen");

const chatScreen =
    document.getElementById("chatScreen");

const nameInput =
    document.getElementById("nameInput");

const joinButton =
    document.getElementById("joinButton");

const status =
    document.getElementById("status");

const messages =
    document.getElementById("messages");

const messageForm =
    document.getElementById("messageForm");

const messageInput =
    document.getElementById("messageInput");

const onlineCount =
    document.getElementById("onlineCount");


let myName = "";

let myUserId = "";


/* =====================================
   입장
===================================== */

joinButton.addEventListener(
    "click",
    joinChat
);


nameInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            joinChat();

        }

    }
);


async function joinChat() {

    const name =
        nameInput.value.trim();

    if (!name) {

        alert("이름을 입력해주세요.");

        return;
    }


    myName =
        name.substring(0, 20);


    joinButton.disabled = true;

    status.textContent =
        "입장 중...";


    try {

        /*
            Firebase가 사용자용
            고유 ID 생성
        */

        const usersRef =
            ref(db, `rooms/${roomId}/users`);

        const userRef =
            push(usersRef);

        myUserId =
            userRef.key;


        /*
            사용자 등록
        */

        await set(
            userRef,
            {
                name: myName
            }
        );


        /*
            나가면 자동 삭제
        */

        onDisconnect(userRef)
            .remove();


        /*
            채팅 화면
        */

        loginScreen.classList.add(
            "hidden"
        );

        chatScreen.classList.remove(
            "hidden"
        );


        messageInput.focus();


        /*
            메시지 감시
        */

        startMessageListener();


        /*
            접속자 감시
        */

        startUserListener();


        status.textContent =
            "입장 완료";

    }

    catch (error) {

        console.error(error);

        alert(
            "채팅방에 연결하지 못했습니다.\n" +
            error.message
        );

        joinButton.disabled = false;

        status.textContent =
            "연결 실패";

    }

}


/* =====================================
   메시지 수신
===================================== */

function startMessageListener() {

    const messagesRef =
        ref(
            db,
            `rooms/${roomId}/messages`
        );


    onChildAdded(
        messagesRef,
        snapshot => {

            const data =
                snapshot.val();

            if (!data) return;


            displayMessage(
                data.name,
                data.text
            );

        }
    );

}


/* =====================================
   사용자 수
===================================== */

function startUserListener() {

    const usersRef =
        ref(
            db,
            `rooms/${roomId}/users`
        );


    onValue(
        usersRef,
        snapshot => {

            const users =
                snapshot.val() || {};

            const count =
                Object.keys(users).length;


            onlineCount.textContent =
                `${count}명 접속 중`;

        }
    );

}


/* =====================================
   메시지 전송
===================================== */

messageForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const text =
            messageInput.value.trim();


        if (!text) return;


        try {

            const messagesRef =
                ref(
                    db,
                    `rooms/${roomId}/messages`
                );


            await push(
                messagesRef,
                {
                    name: myName,
                    text: text.substring(0, 500),

                    time:
                        Date.now()
                }
            );


            messageInput.value = "";

            messageInput.focus();

        }

        catch (error) {

            console.error(error);

            alert(
                "메시지를 보내지 못했습니다."
            );

        }

    }
);


/* =====================================
   메시지 화면
===================================== */

function displayMessage(
    name,
    text
) {

    const element =
        document.createElement("div");


    element.className =
        "message";


    if (name === myName) {

        element.classList.add(
            "mine"
        );

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
        textContent를 사용해서
        HTML 코드가 실행되지 않도록 함
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


    messages.scrollTop =
        messages.scrollHeight;

}
