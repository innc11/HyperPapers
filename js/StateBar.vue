<template>
    <div style="display: inline-flex; margin: auto; margin-top: 0.3rem; margin-bottom: 0.3rem;" >
        
        <div class="buttons are-small" >
            <button id="debugMode" class="button" 
                v-bind:style="debugMode?'color: #ffaa00':''"
                v-on:click="debugMode = !debugMode"
                v-on:click.right.prevent="alternateWindow = !alternateWindow" >
                调试
            </button>
            
            <button id="connect" class="button"
                v-bind:class="linkstate?'statabar-connected':''"
                title="连接">
                {{linkstate?user:"离线"}}
            </button>
        </div>
        
        <div class="buttons are-small" 
            v-if="clipboard!='' && !filebrowser.editing" >
            
            <div class="inline"
                style="margin: 0px 5px;"
            >{{clipboardMoveMode?"剪切模式":"复制模式"}} {{clipboard}}</div>
            
            <button class="button"
                v-if="clipboard!=''"
                v-on:click="clipboard = ''"
            >取消</button>
        </div>
            
        <div class="inline" 
            style="margin-left: 5px; display: inline-flex; align-self: center; transition:  all 1s;"
            v-bind:style="filebrowser.contentModified? 'color: #f38d42':''" >
            {{filebrowser.contentModified? '*':''}}{{filebrowser.editing? filebrowser.endOfPath:''}}
        </div>
        
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import * as $ from 'jquery'
import { fileBrowser } from '.'

export default {
    data: function() {
        return {
            "debugMode": false,
            "clipboard": '',
            "clipboardMoveMode": false,
            "alternateWindow": false,
            
            'user': '',
            "linkstate": false,
        }
    },
    // props: ['linkstate'],
    computed: {
        'filebrowser': function() {
            return fileBrowser
        }
    },
    methods: {
        'getTitle': function() {
            return (fileBrowser.contentModified? '*':'') 
                + (this.linkstate? '':'[离线]')
                + fileBrowser.endOfPath
                + (fileBrowser.folder!=''? ' - ':'')
                + "OxygenPapers"
        }
    },
    watch: {
        "alternateWindow": function(newValue: boolean, oldValue: boolean) {
            if(newValue==true) {
                $('#editor').css('display', 'none')
                $('#filebrowser').css('display', 'flex')
            } else {
                $('#editor').css('display', '')
                $('#filebrowser').css('display', 'none')
            }
        },
        'linkstate': function(newValue: boolean, oldValue: boolean) {
            fileBrowser.updateTitle()
        },
        'user': function(newValue: string, oldValue: string) {
            fileBrowser.user = newValue
        },
    }
}
</script>

<style>
    .statabar-connected {
        color: #ea9500 !important;
        font-weight: 600;
    }
</style>