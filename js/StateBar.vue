<template>
    <div id="statebar">
        <div style="width: fit-content; margin: auto; display: flex;" >
            
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
                
            <div class="inline editing-file" 
                v-bind:style="filebrowser.contentModified? 'color: #f38d42':''" >
                {{filebrowser.contentModified? '*':''}}{{filebrowser.editing? '正在编辑 '+filebrowser.endOfPath:''}}
            </div>

            <div class="buttons are-small" style="margin-right: 8px;">
                <button id="connect" class="button is-small"
                    v-bind:class="linkstate?'statabar-connected':''"
                    v-on:click="onClickConnection" 
                    v-on:click.right.prevent="alternateWindow = !alternateWindow" >
                    {{linkstate? authenticating? '正在认证':'已登录 '+user:'离线'}}
                </button>
            </div>

            <div class="buttons are-small"
                    v-if="filebrowser.editing" >

                <div class="button" v-on:click="onClickSave" > 保存</div>
                <div class="button" v-on:click="onClickAttachments">图片</div>
                <div class="button" title='右键点击：不保存关闭'
                    v-on:click="onClickClose"
                    v-on:click.right.prevent="onClickCloseWithRight" >
                    关闭
                </div>
            </div>
            
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import * as $ from 'jquery'
import { fileBrowser, pluginSystem } from '.'
import { bubble } from './utils'
import { hye_save } from './editor'

export default {
    data: function() {
        return {
            "debugMode": false,
            "clipboard": '',
            "clipboardMoveMode": false,
            "alternateWindow": false,
            
            'user': '',
            'keepConnection': false,
            'nextReconnection': 0,
            'authenticating': false,
            "linkstate": false,
        }
    },
    computed: {
        filebrowser: function() {
            return fileBrowser
        }
    },
    methods: {
        getTitle: function() {
            let reconcectionText = this.nextReconnection!=0?'[重连'+parseInt(this.nextReconnection/1000+'')+']':'[正在重连]'
            
            return (fileBrowser.contentModified? '*':'') 
                + (this.linkstate? '':this.keepConnection? reconcectionText:'[离线]')
                + fileBrowser.endOfPath
                + (fileBrowser.endOfPath==''? 'HyperPapers':'')
        },
        onClickSave: function() {
            hye_save(() => {}, true)
        },
        onClickClose: function() {
            if(fileBrowser.editing && !fileBrowser.contentLoaded) {
                bubble("文件内容还未加载完成，无法关闭")
                return
            }
            
            if(fileBrowser.editing)
                fileBrowser.back()
        },
        onClickCloseWithRight: function() {
            if(confirm("不保存关闭?")) {
                fileBrowser.contentModified = false
                $('#closeDoc').click()
            }
                
            return false;
        },
        onClickConnection: function() {
            pluginSystem.getPlugin('auth').vue.open()
        },
        onClickAttachments: function() {
            if(fileBrowser.editing)
			    pluginSystem.getPlugin('attach').vue.open()
        }
    },
    watch: {
        alternateWindow: function(newValue: boolean, oldValue: boolean) {
            if(newValue==true) {
                $('#editor').css('display', 'none')
                $('#filebrowser').css('display', 'flex')
            } else {
                $('#editor').css('display', '')
                $('#filebrowser').css('display', 'none')
            }
        },
        linkstate: function(newValue: boolean, oldValue: boolean) {
            fileBrowser.updateTitle()
        },
        user: function(newValue: string, oldValue: string) {
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

    #statebar {
        width: 100%; 
        align-self: center; 
        padding: 0.3rem 0rem; 
        box-shadow: 0px -6px 3px -5px inset #e2e2e2;
    }

    @media(prefers-color-scheme: dark) {
        #statebar {
            box-shadow: #484848 0px -6px 3px -5px inset;
        }
    }

    .editing-file {
        margin: 0px 5px; 
        display: inline-flex; 
        align-self: center; 
        transition: all 1s;
    }

    @media(max-width: 768px)
    {
        .editing-file {
            display: none !important;
        }
    }
</style>