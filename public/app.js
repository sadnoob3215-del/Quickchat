const socket = io();

const loginScreen = document.getElementById("loginScreen");
const chatScreen = document.getElementById("chatScreen");

const nameInput = document.getElementById("nameInput");
const joinButton = document.getElementById("joinButton");

const userName = document.getElementById("userName");

const messages = document.getElementById("messages");

const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");

let myName = "";


/* 입장 */

function joinChat() {

    const name = nameInput.value.trim();

    if (!name) {
        alert("이름을 입력해주세요.");
        nameInput.focus();
        return;
    }

    myName = name.slice(0, 20);

    socket.emit("join", myName);
}


/* 버튼 */

joinButton.addEventListener("click", joinChat);


/* 엔터로 입장 */

nameInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        joinChat();
    }

});


/* 입장 완료 */

socket.on("joined", (data) => {

    loginScreen.classList.add("hidden");
    chatScreen.classList.remove("hidden");

    userName.textContent = `· ${data.name}`;

    messageInput.focus();

});


/* 시스템 메시지 */

socket.on("system", (message) => {

    const element = document.createElement("div");

    element.className = "system";

    element.textContent = message;

    messages.appendChild(element);

    scrollToBottom();

});


/* 일반 메시지 */

socket.on("message", (data) => {

    const element = document.createElement("div");

    element.className = "message";

    const name = document.createElement("div");
    name.className = "message-name";
    name.textContent = data.name;

    const text = document.createElement("div");
    text.className = "message-text";
    text.textContent = data.message;

    element.appendChild(name);
    element.appendChild(text);

    messages.appendChild(element);

    scrollToBottom();

});


/* 메시지 전송 */

messageForm.addEventListener("submit", (event) => {

    event.preventDefault();

    const message = messageInput.value.trim();

    if (!message) return;

    socket.emit("message", message);

    messageInput.value = "";

    messageInput.focus();

});


/* 아래로 스크롤 */

function scrollToBottom() {

    messages.scrollTop = messages.scrollHeight;

}
