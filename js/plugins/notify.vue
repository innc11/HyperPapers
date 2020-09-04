<template>
    <div class="messages-container">
        <div class="messages-text" 
            v-for="msg in messages"
            v-bind:id = "msg.id"
            v-on:click="removeMessage(msg.id)" >
            {{msg.text}}
        </div>
    </div>
</template>

<style>
    .messages-container {
        position: fixed;
        right: 4%;
        top: 40px;
        text-align: center;
        z-index: 1000000000;
        display: flex;
        flex-direction: column-reverse;
        align-items: flex-end;
    }

    .messages-text {
        font-size: 16px;
        font-weight: normal;
        border-radius: 5px;
        padding: 0.5rem 0.5rem;
        margin: 0.5rem 0rem;
        width: fit-content;
        background-color: #5fd270;
        color: #fff;
        line-height: 1;
        transition: opacity 3s ease 0s, top 0.8s ease 0s, right 0.5s ease 0s;
        text-shadow: 0px 0px 4px #698a68;
        cursor: pointer;
    }

</style>

<script lang="ts">
import Vue from 'vue'

interface MessageObject
{
    id: string
    text: string
    duration: number
}

function addMessage(text: string, duration = 2000) {
    let rid = 'm' + Math.ceil(Math.random() * 1000000000000000).toString()

    this.messages.push({
        id: rid,
        text: text,
        duration: duration / 1000
    })

    setTimeout(() => {
        this.removeMessage(rid)
    }, duration)

    return rid
}

function removeMessage(rid: string) {
    this.messages = this.messages.filter((e: MessageObject) => {
        return e.id != rid
    })
}

export default {
    data: () => {
        return {
            messages: [] as Array<MessageObject>
        }
    },
    methods: {
        addMessage: addMessage,
        removeMessage: removeMessage,
    }
}
</script>