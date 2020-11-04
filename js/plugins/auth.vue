<template>
    <div id="auth-dialog" title="连接信息" class="ui-resizable" style="display: none; height: 260px; width: 390px; color: #666;">
        <div>
            <div style="display: flex">
                <label class="auth-label" >地址</label>
                <input id="auth-address" type="text" class="auth-input auth-font" autocomplete="off" spellcheck="false" value="ws://127.0.0.1:800" ></input>
            </div>
                
            <div style="display: flex">
                <label class="auth-label" >用户</label>
                <input id="auth-user" type="text" class="auth-input auth-font" autocomplete="off" spellcheck="false" value="" ></input>
            </div>
                
            <div style="display: flex">
                <label class="auth-label" >密码</label>
                <input id="auth-password" type="password" class="auth-input auth-font" autocomplete="off" spellcheck="false" value="" ></input>
            </div>
            
        </div>

        <div style="float: right">
            <button class="auth-actions-clear button">清理Cookies</button>
            <button class="auth-actions-login button">连接</button>
            <button class="auth-actions-close button">关闭</button>
        </div>
    </div>
</template>

<style type="text/css">
    .auth-input {
        display: inline-block;
        height: 35px;
        padding: 0px 8px;
        margin-left: 8px;
        width: 283px;
        color: #999 !important;
        font-size: 1rem;
        flex: 1;
    }

    .auth-label{
        padding: 7px 0 15px 5px;
        margin: 0 0 2px;
        display: inline-block;
    }
    
    #auth-actions-login{
        transition: background-color 0.6s;
    }
    
    .auth-font {
        font-family: "Consolas", "微软雅黑", 'Open Sans', 'Helvetica', 'Tahoma, Arial', 'Hiragino Sans GB', "Microsoft YaHei", "Micro Hei", 'SimSun', "宋体", 'Heiti', "黑体", 'sans-serif' !important;
    }
    
</style>

<script lang="ts">
import Vue from 'vue'
import * as $ from 'jquery'
import 'jquery-ui'
import { bubble } from '../utils';
import { stateBar, websocket } from '..';
import { PluginObject } from '../PluginSystem';

// https://www.cnblogs.com/lanleiming/p/7096973.html
function isJSON(str: string) {
    try {
        let obj=JSON.parse(str);
        if(typeof obj == 'object')
            return true;
        return false;
    } catch(e) {
        return false;
    }
}

function getCookies() {
	let r = $.cookie('address')
	if(r==null || typeof(r)=='undefined' || r=='wss://')
		return null
	return r
}

function fillInputField() {
    let address = $.cookie('address')
    let user = $.cookie('user')
    let password = $.cookie('password')

    if(typeof(address)!='undefined')
        $('#auth-address').val(address)
    if(typeof(user)!='undefined')
        $('#auth-user').val(user)
    if(typeof(password)!='undefined')
        $('#auth-password').val(password)

    if(typeof(address)=='undefined'
            && typeof(user)=='undefined' 
            && typeof(password)=='undefined') {
        $.ajax({
            url: "default",  async:    true,
            cache: false,    dataType: "text",
            success: function(res: string) {
                if(isJSON(res)) {
                    $('#auth-address').val(JSON.parse(res)[0])
                    
                    console.log('default loaded')
                }
                console.log('default found')
            },
            error: function(xhr: XMLHttpRequest,status: any,error: any) {
                console.log('default fail to get')
            }
        })
    }
}

function checkFieldsAndSetCookies() {
    if(!websocket.isConnected()) {
        let address = $('#auth-address').val()
        let user = $('#auth-user').val()
        let password = $('#auth-password').val()
        
        if(address=='') {
            bubble('地址不能为空'); return;
        }

        if(user=='') {
            bubble('用户不能为空'); return;
        }
        
        if(password=='') {
            bubble('密码不能为空'); return;
        }

        if(address=='wss://') {
            bubble('地址不能为默认'); return;
        }

        $.cookie('address', address, { expires: 100 })
        $.cookie('user', user, { expires: 100 })
        $.cookie('password', password, { expires: 100 })
    }
}

function initDialog() {
    fillInputField()

    // 回车触发
    $('#auth-address,#auth-user,#auth-password').keydown((e: any) => {
        if(e.keyCode == 13) {
            $('.auth-actions-login').click()
        }
    })

    $('.auth-actions-close').click((e: any) => {
        this.close()
    })

    $('.auth-actions-clear').click((e: any) => {
        $.removeCookie('address')
        $.removeCookie('user')
        $.removeCookie('password')
        this.dialog.dialog('close')
        bubble('已清理，刷新生效')
    })

    $('.auth-actions-login').click((e: any) => {
        checkFieldsAndSetCookies()
        
        if(websocket.isConnected()) {
            stateBar.keepConnection = false
            websocket.disconnect()
        }else{
            let add = getCookies()
            if(add==null) {
                bubble('请设置服务器地址')
            }else{
                websocket.setURL(add)
                websocket.connect()
            }
        }
    })

    // 自动连接
    setTimeout(() => {
        let user = $.cookie('user')
        let password = $.cookie('password')
        let address = $.cookie('address')
        
        if(user==null || password==null || address==null) {
            this.open()
        }else{
            if(!websocket.isConnected()) {
                websocket.setURL(getCookies())
                websocket.connect()
            }
        }
    }, 500)
}

function create() {
    this.dialog = $('#auth-dialog').dialog({
        width: Math.min(360, document.body.clientWidth),
        height: 250,
        modal: true,
        resizable: false,
        autoOpen: false,
        position: { my: 'top', at: 'center top', of: '#container'},
        appendTo: '#' + this.pluginObject.containerId,
        open: (event: any, ui: any) => {
            if(this.onOpenCallback) {
				this.onOpenCallback()
				this.onOpenCallback = null
			}
        },
        close: (event: any, ui: any) => {
            if(this.onCloseCallback) {
				this.onCloseCallback()
				this.onCloseCallback = null
			}
        },
        create: (event: any, ui: any) => {
            initDialog.bind(this)()
            if(this.onDestroyCallback) {
				this.onDestroyCallback()
				this.onDestroyCallback = null
			}
        }
    })
}

function open(callback = () => {}) {
    this.onOpenCallback = callback
    this.dialog.dialog('open')
}

function close(callback: () => void) {
    this.onCloseCallback = callback
    this.dialog.dialog('close')
}

function destroy(callback = () => {}) {
    this.onDestroyCallback = callback
    this.dialog.dialog('destroy')
}

function updateState() {
    let loginButton = $('.auth-actions-login')
    
    if(websocket.isConnected()) {
        loginButton.html('断开')
        loginButton.css({'background-color':'#c2fba5'})
    }else{
        loginButton.html('连接')
        loginButton.css({'background-color':''})
    }
}

export default {
    data: function() {
        return {
            pluginObject: null as PluginObject,
            dialog: null as any,

            onOpenCallback: null as () => void,
			onCloseCallback: null as () => void,
			onDestroyCallback: null as () => void,
        }
    },
    methods: {
        init: create,
        open: open,
        close: close,
        destroy: destroy,
        updateState: updateState
    }
}
</script>