import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    push,
    onChildAdded,
    onValue,
    onDisconnect,
    set
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


const app =
    initializeApp(firebaseConfig);


const auth =
    getAuth(app);


const db =
    getDatabase(app);


/* =====================================
   기본 설정
===================================== */

const roomId =
    "main-room";


/* =====================================
   화면 요소
===================================== */

const loginScreen =
    document.getElementById(
        "loginScreen"
    );


const chatScreen =
    document.getElementById(
        "chatScreen"
    );


const nameInput =
    document.getElementById(
        "nameInput"
    );


const joinButton =
    document.getElementById(
        "joinButton"
    );


const status =
    document.getElementById(
        "status"
    );


const messages =
    document.getElementById(
        "messages"
    );


const messageForm =
    document.getElementById(
        "messageForm"
    );


const messageInput =
    document.getElementById(
        "messageInput"
    );


const onlineCount =
    document.getElementById(
        "onlineCount"
    );


/* =====================================
   사용자 정보
===================================== */

let myName = "";

let myUserId = "";

let joined = false;


/* =====================================
   입장 버튼
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


/* =====================================
   채팅 입장
===================================== */

async function joinChat() {

    if (joined) {

        return;

    }


    const name =
        nameInput.value.trim();


    if (!name) {

        alert(
            "이름을 입력해주세요."
        );

        return;

    }


    myName =
        name.substring(
            0,
            20
        );


    joinButton.disabled =
        true;


    status.textContent =
        "보안 연결 중...";


    try {

        /* -----------------------------
           Firebase 익명 로그인
        ----------------------------- */

        const userCredential =
            await signInAnonymously(
                auth
            );


        const user =
            userCredential.user;


        myUserId =
            user.uid;


        /* -----------------------------
           사용자 등록
        ----------------------------- */

        const userRef =
            ref(
                db,
                `rooms/${roomId}/users/${myUserId}`
            );


        await set(
            userRef,
            {
                name:
                    myName,

                joinedAt:
                    Date.now()
            }
        );


        /* -----------------------------
           연결 종료 시 자동 삭제
        ----------------------------- */

        await onDisconnect(
            userRef
        ).remove();


        /* -----------------------------
           화면 전환
        ----------------------------- */

        joined =
            true;


        loginScreen.classList.add(
            "hidden"
        );


        chatScreen.classList.remove(
            "hidden"
        );


        messageInput.focus();


        /* -----------------------------
           실시간 기능
        ----------------------------- */

        startMessageListener();

        startUserListener();


        status.textContent =
            "연결 완료";

    }

    catch (error) {

        console.error(
            "Firebase 오류:",
            error
        );


        alert(
            "채팅방에 연결하지 못했습니다.\n\n" +
            error.message
        );


        joinButton.disabled =
            false;


        status.textContent =
            "연결 실패";

    }

}


/* =====================================
   메시지 실시간 수신
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


            if (!data) {

                return;

            }


            displayMessage(
                data.uid,
                data.name,
                data.text
            );

        }
    );

}


/* =====================================
   접속자 수
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
                Object.keys(
                    users
                ).length;


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


        if (!joined) {

            return;

        }


        const text =
            messageInput.value.trim();


        if (!text) {

            return;

        }


        try {

            const messagesRef =
                ref(
                    db,
                    `rooms/${roomId}/messages`
                );


            await push(
                messagesRef,
                {

                    uid:
                        myUserId,

                    name:
                        myName,

                    text:
                        text.substring(
                            0,
                            500
                        ),

                    time:
                        Date.now()

                }
            );


            messageInput.value =
                "";


            messageInput.focus();

        }

        catch (error) {

            console.error(
                "메시지 전송 오류:",
                error
            );


            alert(
                "메시지를 보내지 못했습니다."
            );

        }

    }
);


/* =====================================
   메시지 표시
===================================== */

function displayMessage(
    uid,
    name,
    text
) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "message";


    /* -----------------------------
       내 메시지
    ----------------------------- */

    if (uid === myUserId) {

        element.classList.add(
            "mine"
        );

    }


    /* -----------------------------
       이름
    ----------------------------- */

    const nameElement =
        document.createElement(
            "div"
        );


    nameElement.className =
        "message-name";


    nameElement.textContent =
        name;


    /* -----------------------------
       내용
    ----------------------------- */

    const textElement =
        document.createElement(
            "div"
        );


    textElement.className =
        "message-text";


    textElement.textContent =
        text;


    /* -----------------------------
       추가
    ----------------------------- */

    element.appendChild(
        nameElement
    );


    element.appendChild(
        textElement
    );


    messages.appendChild(
        element
    );


    /* -----------------------------
       가장 아래로
    ----------------------------- */

    messages.scrollTop =
        messages.scrollHeight;

}
