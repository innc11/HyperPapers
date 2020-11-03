<template>
    <div id="filebrowser">
        <div class="filebrowser-path"
            v-bind:style="editing? 'background-color: yellow':''"
        >
            <div class="inline" 
                    v-on:click="stateBar.debugMode = !stateBar.debugMode" >
                <i class="fa fa-window-minimize" aria-hidden="true"
                    style="font-size: 14px; cursor: pointer;"></i>
            </div>
            
            <div class="filebrowser-path-cells" style="display: inline-flex;">
                <div class="path-cell"
                    v-for="path in pathCells"
                    v-bind:title="path.path"
                >
                    <div class="path-cell-path"
                        v-on:click.stop="onClickPathCell(path)"
                    >{{path.name == ''? user:(path.name.length > 10? path.name.substr(0, 10) + '...':path.name)}}</div>
                    <div class="path-cell-split"><i class="fa fa-chevron-right" aria-hidden="true"></i></div>
                </div>
            </div>
        </div>
        
        <div class="filebrowser-filelist scroll-bar ">
            
            <div class="file-item level"
                    v-for="f in sortedFiles" 
                    v-if="isFileShown(f)"
                    v-on:click="itemClickCallback(f)"
                    v-bind:class="stateBar.clipboard==(folder+f.filename)? 'file-item-moving':''"
                    v-bind:isfile="f.isfile? 'true':''"
                    v-bind:path="folder + (folder!=''?'/':'') + f.filename"
                    v-bind:filename="f.filename"
                >
                
                <span class="level-left">
                    <i class="file-item-icon file-item-file   fa fa-file-text-o"   aria-hidden="true" v-if="f.isfile"></i>
                    <i class="file-item-icon file-item-folder fa fa-folder-open-o" aria-hidden="true" v-if="!f.isfile"></i>
                    <div class="inline file-item-filename">
                        <div class="file-item-filename-text">{{stateBar!=null && stateBar.debugMode? f.filename:f.simplename}}</div>
                    </div>
                </span>
                
                <span class="level-right" style="margin-top: 0px;"
                    v-if="stateBar.debugMode">
                    <div class="file-item-capacity">{{!f.isfile? f.size+"个文件":f.size}}</div>
                </span>
                    
            </div>
            
            <div style="text-align: center; height: 100%;"
                    v-show="a_files.length<=0"
                >
                <div style="margin: auto; height: 20%; transform: translate(0, 100%);">
                    这里什么都没有
                </div>
            </div>
        </div>
        
    </div>
</template>

<style>
    .path-cell {
        display: flex;
    }
    .path-cell-path, .path-cell-split {
        display: inline-block;
        transition: background-color 0.2s;
        padding: 3px 8px;
    }
    .path-cell-split {
        transform: scale(0.55);
    }
    .path-cell-path {
        cursor: pointer;
        border-bottom: #00000030 1px solid;
        font-size: 16px;
    }
    .path-cell-path:hover {
        background-color: #c7c7c7;
        border-color: #c7c7c7;
        border-radius: 5px;
    }
    .filebrowser-path-cells .path-cell:last-child .path-cell-split{
        display: none;
    }

    .filebrowser-path {
        width: calc(100% - 15px);
        
        padding: 0px 10px 6px 10px;
        margin: 0px 0px 4px 0px;
        line-height: 1.5rem;
        border-bottom: solid 1px #dfdfe0;
        
        word-break: break-all;
        user-select: none;
    }

    .filebrowser-filelist {
        width: 100%;
        height: calc(100% - 35px);
        top: 31px;
        flex: 1;
    }

    #filebrowser {
        height: calc(100% - 55px);
        max-width: 500px;
        padding: 15px;
        margin: 10px auto;
        display: flex;
        flex-direction: column;
        border: 1px solid #9898982b;
        border-radius: 3px;
    }

    .file-item {
        margin: 0px 4px;
        padding: 0px 4px;
        line-height: 2rem;
        cursor: pointer;
        overflow: hidden;
        
        user-select: none;
    }
    .file-item:hover {
        background-color: #d1d1d1;
        border-radius: 0.1rem;
    }
    .file-item:active {
        background-color: #afafaf;
    }

    .file-item-icon {
        font-size: 18px;
        width: 20px;
        text-shadow: 1px 0.5px #80808033;
    }

    .file-item-file {
        color: #8a8a8ae0;
    }

    .file-item-folder {
        color: #efab13;
    }

    .file-item-capacity {
        transition: opacity 0.2s;
        opacity: 0.3;
        float: right;
        font-size: 1rem;
        color: #ff5500;
    }

    .file-item-moving {
        background: #9a9a9a3b;
        box-shadow: 0px 0px 2px 1px #6969693b;
    }

    .file-item-filename {
        white-space: nowrap;
        margin-left: 2px;
    }

    .file-item-filename-text {
        text-overflow: ellipsis; 
        display: inline; 
        overflow: hidden;
        font-size: 1rem;
    }

    .file-item:hover .file-item-capacity {
        opacity: 1;
    }

</style>

<script lang="ts">
    import Vue from 'vue'
    import * as $ from 'jquery'
    import {bubble} from '../utils'
    import {hye, hye_save} from '../editor'
    import { stateBar, websocket } from '..'

    interface FileObject
    {
        filename: string
        isfile: boolean
        size: number
        simplename: string
    }

    interface DirObject
    {
        name: string
        path: string
    }

    // computed
        
    function getPath() {
        return this.a_paths.join("/")
    }

    function getFolder() {
        let paths = this.a_paths
        if(paths.length > 0) {
            if(this.editing) {
                let end = this.path.lastIndexOf('/')
                return this.path.substring(0, end)
            }
            return this.path
        }
        return ''
    }

    function getEndOfPath() {
        let paths = this.a_paths
        if(paths.length > 0)
            return paths[paths.length - 1]
        return ''
    }

    function getSortedFiles() {
        let _this = this
        
        function sortfun(obj1: FileObject, obj2: FileObject) {
            function iscn(str: string) {
                return /^[\\u4E00-\\u9FA5]/.test(str) // is chinese
            }
            
            function isassets(str: string) {
                return str.endsWith('.assets')
            }
            
            if(!obj1.isfile && obj2.isfile)
                return -1
            if(obj1.isfile && !obj2.isfile)
                return 1
            if(obj1.isfile == obj2.isfile)
            {
                if(isassets(obj1.filename) && !isassets(obj2.filename))
                    return -1
                if(!isassets(obj1.filename) && isassets(obj2.filename))
                    return 1
                if(isassets(obj1.filename) == isassets(obj2.filename))
                {
                    if(iscn(obj1.filename) && !iscn(obj2.filename))
                        return -1
                    if(!iscn(obj1.filename) && iscn(obj2.filename))
                        return 1
                    if(iscn(obj1.filename) == iscn(obj2.filename))
                        return obj1.filename.localeCompare(obj2.filename, "zh");
                }
                
            }
        }
        
        function getFiles() {
            let files = _this.a_files.slice(0)
            
            return files.map(function(e: FileObject) {
                e.simplename = e.filename
                let ext = e.filename.lastIndexOf('.md')
                if(ext!=-1)
                    e.simplename = e.filename.substring(0, ext)
                    
                return e
            })
        }
        
        return getFiles().sort(sortfun)
    }

    function getPathCells() {
        let cells = this.a_paths.slice(0)
        let p = ''
        cells = cells.map(function(e: string) {
            p += (p!='' && e!= ''? '/':'') + e
            return {
                'name': e,
                'path': p
            }
        })
        
        cells.unshift({
            'name': '',
            'path': ''
        })
        
        return cells
    }

    function getStateBar() {
        return stateBar
    }

    // mothods

    function setPath(path: string) {
        if(!this.checkLinkstate())
            return
        
        let temp = path.split("/")
        
        if(temp.length==1 && temp[0]=='')
            this.a_paths = []
        else
            this.a_paths = temp
    }

    function enter(file: FileObject) {
        if(!this.checkLinkstate())
            return
        
        if(this.editing)
            throw new Error("当前已经打开了一个文件!")
        
        if(file.isfile) {
            let docExts = new Array("txt", "json", "xml", "md", "yml")
            let extSp = file.filename.lastIndexOf('.')
            let suffix = extSp != -1? file.filename.substring(extSp + 1):''
            let isDocFile = $.inArray(suffix, docExts) != -1
            
            if(!isDocFile) {
                if(!confirm(file.filename+' 可能是一个二进制文件，执意要打开吗？')) {
                    return
                }
            }
        }
        
        this.a_paths.push(file.filename)
    }

    function back(callback = () => {}) {
        if(!this.checkLinkstate())
            return
        
        if(this.editing) {
            hye_save()
            try {
                hye.setValue('')
            } catch(e){
                console.log(e)
            }
            this.contentModified = false
            this.contentLoaded = false
            this.a_paths.splice(this.a_paths.length - 1, 1)
            this.editing = false
            this.stateBar.alternateWindow = !this.stateBar.alternateWindow
            
            callback()
        }else{
            this.a_paths.splice(this.a_paths.length - 1, 1)
            callback()
        }
    }

    function access() {
        let file = this.endOfPath

        for(let f of this.a_files) {
            if(f.isfile && f.filename == file) { // is a file
                this.editing = true
                break
            }
        }
        
        websocket.sendMessage({"action":"access_path", "path": this.path})
    }

    function checkLinkstate() {
        if(!this.stateBar.linkstate) {
            bubble("当前已离线，无法进行此操作")
            return false
        }
        return true
    }

    function updateTitle() {
        $('title').text(this.stateBar.getTitle())
    }

    function isFileEditing(filename: string) {
        return this.editing && this.endOfPath == filename
    }

    function onItemClick(file: FileObject) {
        let _this = this
        let editing = this.isFileEditing(file.filename)

        try {
            this.enter(file)
        }catch(e){
            bubble(e)
        }
    }

    function onClickPathCell(cell: DirObject) {
        if(this.editing)
            bubble('正在编辑文件，不可切换目录')
        else
            this.setPath(cell.path)
    }

    function isFileShown(file: FileObject) {
        let shadows = ["preferences.json", "RecycleBin"]
        let path = this.folder + (this.folder!=''?'/':'') + file.filename
        let show = true
        show = show && !file.filename.endsWith('.assets')
        show = show && !(shadows.indexOf(path)!=-1)
        show = show || this.stateBar.debugMode
        return show
    }

    // watch

    function watcher_path(newValue: Array<FileObject>, oldValue: Array<FileObject>) {
        this.access()
        this.updateTitle()
    }

    function watcher_contentModified(newValue: boolean, oldValue: boolean) {
        this.updateTitle()
    }

    

    export default {
        data: function() {
            return {
                a_files: [] as Array<FileObject>, // list of files in the a_paths
                a_paths: [] as Array<string>,
                editing: false, // 有文件正被打开
                contentLoaded: false, // 文档内容加载完成
                contentSaving: false, // 文档内容正在加载
                contentModified: false, // 文档内容已被修改
                user: '',
                
                onSavedCallback: function() {}, // 保存回调
            }
        },
        computed: {
            path: getPath,
            folder: getFolder,
            endOfPath: getEndOfPath,
            sortedFiles: getSortedFiles,
            pathCells: getPathCells,
            stateBar: getStateBar
        },
        methods:{
            setPath: setPath,
            enter: enter,
            back: back,
            refresh: access,
            access: access,
            checkLinkstate: checkLinkstate,
            updateTitle: updateTitle,
            
            isFileEditing: isFileEditing,
            itemClickCallback: onItemClick,
            onClickPathCell: onClickPathCell,
            isFileShown: isFileShown
        },
        watch: {
            a_paths: watcher_path,
            contentModified: watcher_contentModified,
        }
    }
</script>

