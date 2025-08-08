import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js';
import { getWebContainer } from '../config/webContainer'


function SyntaxHighlightedCode(props) {
    const ref = useRef(null)

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current)

            // hljs won't reprocess the element unless this attribute is removed
            ref.current.removeAttribute('data-highlighted')
        }
    }, [ props.className, props.children ])

    return <code {...props} ref={ref} />
}


const Project = () => {

    const location = useLocation()

    const [ isSidePanelOpen, setIsSidePanelOpen ] = useState(false)
    const [ isModalOpen, setIsModalOpen ] = useState(false)
    const [ selectedUserId, setSelectedUserId ] = useState(new Set()) // Initialized as Set
    const [ project, setProject ] = useState(location.state.project)
    const [ message, setMessage ] = useState('')
    const { user } = useContext(UserContext)
    const messageBox = React.createRef()

    const [ users, setUsers ] = useState([])
    const [ messages, setMessages ] = useState([]) // New state variable for messages
    const [ fileTree, setFileTree ] = useState({})

    const [ currentFile, setCurrentFile ] = useState(null)
    const [ openFiles, setOpenFiles ] = useState([])

    const [ webContainer, setWebContainer ] = useState(null)
    const [ iframeUrl, setIframeUrl ] = useState(null)

    const [ runProcess, setRunProcess ] = useState(null)

    const handleUserClick = (id) => {
        setSelectedUserId(prevSelectedUserId => {
            const newSelectedUserId = new Set(prevSelectedUserId);
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id);
            } else {
                newSelectedUserId.add(id);
            }

            return newSelectedUserId;
        });


    }


    function addCollaborators() {

        axios.put("/projects/add-user", {
            projectId: location.state.project._id,
            users: Array.from(selectedUserId)
        }).then(res => {
            console.log(res.data)
            setIsModalOpen(false)

        }).catch(err => {
            console.log(err)
        })

    }

    const send = () => {

        sendMessage('project-message', {
            message,
            sender: user
        })
        setMessages(prevMessages => [ ...prevMessages, { sender: user, message } ]) // Update messages state
        setMessage("")

    }

    function WriteAiMessage(message) {

        const messageObject = JSON.parse(message)

        return (
            <div
                className='overflow-auto bg-slate-950 text-white rounded-sm p-2'
            >
                <Markdown
                    children={messageObject.text}
                    options={{
                        overrides: {
                            code: SyntaxHighlightedCode,
                        },
                    }}
                />
            </div>)
    }

    useEffect(() => {

        initializeSocket(project._id)

        if (!webContainer) {
            getWebContainer().then(container => {
                setWebContainer(container)
                console.log("container started")
            })
        }


        receiveMessage('project-message', data => {

            console.log(data)
            
            if (data.sender._id == 'ai') {


                const message = JSON.parse(data.message)

                console.log(message)

                webContainer?.mount(message.fileTree)

                if (message.fileTree) {
                    setFileTree(message.fileTree || {})
                }
                setMessages(prevMessages => [ ...prevMessages, data ]) // Update messages state
            } else {


                setMessages(prevMessages => [ ...prevMessages, data ]) // Update messages state
            }
        })


        axios.get(`/projects/get-project/${location.state.project._id}`).then(res => {

            console.log(res.data.project)

            setProject(res.data.project)
            setFileTree(res.data.project.fileTree || {})
        })

        axios.get('/users/all').then(res => {

            setUsers(res.data.users)

        }).catch(err => {

            console.log(err)

        })

    }, [])

    function saveFileTree(ft) {
        axios.put('/projects/update-file-tree', {
            projectId: project._id,
            fileTree: ft
        }).then(res => {
            console.log(res.data)
        }).catch(err => {
            console.log(err)
        })
    }


    // Removed appendIncomingMessage and appendOutgoingMessage functions

    function scrollToBottom() {
        messageBox.current.scrollTop = messageBox.current.scrollHeight
    }

    return (
        <main className="h-screen w-screen flex flex-col md:flex-row bg-gradient-to-br from-slate-100 to-slate-300 overflow-hidden">
            {/* Sidebar */}
            <section className="left relative flex flex-col h-1/2 md:h-screen md:min-w-80 w-full md:w-96 bg-white shadow-lg z-20">
                <header className="flex justify-between items-center p-4 w-full bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <button className="flex gap-2 items-center text-blue-600 hover:text-blue-800 font-medium transition" onClick={() => setIsModalOpen(true)}>
                        <i className="ri-add-fill mr-1"></i>
                        <span>Add collaborator</span>
                    </button>
                    <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className="p-2 rounded hover:bg-slate-200 transition">
                        <i className="ri-group-fill text-xl"></i>
                    </button>
                </header>
                {/* Chat Area */}
                <div className="conversation-area pt-16 pb-16 flex-grow flex flex-col h-full relative overflow-hidden">
                    <div
                        ref={messageBox}
                        className="message-box px-2 flex-grow flex flex-col gap-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
                    >
                        {messages.map((msg, index) => (
                            <div key={index} className={`message flex flex-col p-3 rounded-xl shadow-sm ${msg.sender._id === 'ai' ? 'bg-gradient-to-r from-slate-900 to-slate-700 text-white max-w-xs' : 'bg-slate-50 max-w-xs'} ${msg.sender._id == user._id.toString() && 'ml-auto'} mb-2`}>
                                <small className="opacity-65 text-xs mb-1">{msg.sender.email}</small>
                                <div className="text-sm break-words">
                                    {msg.sender._id === 'ai' ?
                                        WriteAiMessage(msg.message)
                                        : <p>{msg.message}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Input Field */}
                    <div className="inputField w-full flex items-center gap-2 px-2 py-3 bg-slate-50 border-t border-slate-200 absolute bottom-0 left-0">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="p-2 px-4 border border-slate-200 rounded-lg outline-none flex-grow focus:ring-2 focus:ring-blue-200 transition" type="text" placeholder="Enter message" />
                        <button
                            onClick={send}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition flex items-center justify-center"><i className="ri-send-plane-fill"></i></button>
                    </div>
                </div>
                {/* Collaborators Side Panel */}
                <div className={`sidePanel w-full h-full flex flex-col gap-2 bg-white shadow-lg absolute transition-all duration-300 ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} top-0 z-30`}>
                    <header className="flex justify-between items-center px-4 py-3 bg-slate-100 border-b border-slate-200">
                        <h1 className="font-semibold text-lg">Collaborators</h1>
                        <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className="p-2 rounded hover:bg-slate-200 transition">
                            <i className="ri-close-fill text-xl"></i>
                        </button>
                    </header>
                    <div className="users flex flex-col gap-2 px-2 py-2 overflow-y-auto">
                        {project.users && project.users.map(user => {
                            
                            return(
                            <div key={user._id} className="user cursor-pointer hover:bg-slate-100 p-2 flex gap-3 items-center rounded-lg transition">
                                <div className="aspect-square rounded-full w-10 h-10 flex items-center justify-center bg-slate-600 text-white">
                                    <i className="ri-user-fill text-lg"></i>
                                </div>
                                <span className="font-medium text-base">{user.email}</span>
                            </div>
                        )
                        })}
                    </div>
                </div>
            </section>
            {/* Main Content */}
            <section className="right flex-1 bg-gradient-to-br from-red-50 to-slate-100 flex flex-col md:flex-row h-1/2 md:h-full overflow-hidden">
                {/* File Explorer */}
                <div className="explorer h-48 md:h-full w-full md:max-w-64 md:min-w-52 bg-slate-100 border-r border-slate-200 flex-shrink-0 overflow-y-auto">
                    <div className="file-tree w-full py-4 px-2 flex flex-col gap-2">
                        {Object.keys(fileTree).map((file, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setCurrentFile(file)
                                    setOpenFiles([ ...new Set([ ...openFiles, file ]) ])
                                }}
                                className={`tree-element cursor-pointer p-3 flex items-center gap-2 rounded-lg transition font-medium text-slate-700 hover:bg-blue-100 ${currentFile === file ? 'bg-blue-200 text-blue-900' : 'bg-white'}`}
                            >
                                <i className="ri-file-3-line text-lg"></i>
                                <span className="truncate">{file}</span>
                            </button>
                        ))}
                    </div>
                </div>
                {/* Code Editor */}
                <div className="code-editor flex flex-col flex-1 h-full min-w-0 bg-white shadow-inner">
                    {/* Tabs */}
                    <div className="top flex justify-between items-center w-full px-4 py-2 bg-slate-50 border-b border-slate-200">
                        <div className="files flex gap-2 overflow-x-auto">
                            {openFiles.map((file, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentFile(file)}
                                    className={`open-file cursor-pointer px-4 py-2 flex items-center gap-2 rounded-t-lg transition font-medium text-slate-700 hover:bg-blue-100 ${currentFile === file ? 'bg-blue-200 text-blue-900' : 'bg-white'}`}
                                >
                                    <span className="truncate">{file}</span>
                                </button>
                            ))}
                        </div>
                        <div className="actions flex gap-2">
                            <button
                                onClick={async () => {
                                    await webContainer.mount(fileTree)
                                    const installProcess = await webContainer.spawn("npm", [ "install" ])
                                    installProcess.output.pipeTo(new WritableStream({
                                        write(chunk) { console.log(chunk) }
                                    }))
                                    if (runProcess) { runProcess.kill() }
                                    let tempRunProcess = await webContainer.spawn("npm", [ "start" ]);
                                    tempRunProcess.output.pipeTo(new WritableStream({
                                        write(chunk) { console.log(chunk) }
                                    }))
                                    setRunProcess(tempRunProcess)
                                    webContainer.on('server-ready', (port, url) => {
                                        setIframeUrl(url)
                                    })
                                }}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition"
                            >
                                <i className="ri-play-fill mr-1"></i> Run
                            </button>
                        </div>
                    </div>
                    {/* Code Area */}
                    <div className="bottom flex-1 flex max-w-full min-h-0 overflow-auto">
                        {fileTree[currentFile] && (
                            <div className="code-editor-area w-full h-full overflow-auto bg-slate-50 p-4 rounded-b-lg">
                                <pre className="hljs h-full rounded-lg">
                                    <code
                                        className="hljs h-full outline-none text-base font-mono bg-transparent"
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                            const updatedContent = e.target.innerText;
                                            const ft = {
                                                ...fileTree,
                                                [currentFile]: {
                                                    file: {
                                                        contents: updatedContent
                                                    }
                                                }
                                            }
                                            setFileTree(ft)
                                            saveFileTree(ft)
                                        }}
                                        dangerouslySetInnerHTML={{ __html: hljs.highlight('javascript', fileTree[currentFile].file.contents).value }}
                                        style={{
                                            whiteSpace: 'pre-wrap',
                                            minHeight: '300px',
                                            paddingBottom: '2rem',
                                            counterSet: 'line-numbering',
                                        }}
                                    />
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
                {/* Iframe Preview */}
                {iframeUrl && webContainer && (
                    <div className="hidden md:flex min-w-96 flex-col h-full bg-white border-l border-slate-200 shadow-lg">
                        <div className="address-bar p-2 border-b border-slate-200 bg-slate-50">
                            <input type="text"
                                onChange={(e) => setIframeUrl(e.target.value)}
                                value={iframeUrl} className="w-full p-2 px-4 bg-slate-100 rounded-lg border border-slate-200" />
                        </div>
                        <iframe src={iframeUrl} className="w-full h-full rounded-b-lg"></iframe>
                    </div>
                )}
            </section>
            {/* Modal for Adding Collaborators */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl relative animate-fade-in">
                        <header className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Select User</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 rounded hover:bg-slate-200 transition">
                                <i className="ri-close-fill text-xl"></i>
                            </button>
                        </header>
                        <div className="users-list flex flex-col gap-2 mb-16 max-h-80 overflow-y-auto">
                            {users.map(user => (
                                <div key={user.id} className={`user cursor-pointer hover:bg-blue-100 ${Array.from(selectedUserId).indexOf(user._id) !== -1 ? 'bg-blue-200' : ''} p-2 flex gap-3 items-center rounded-lg transition`} onClick={() => handleUserClick(user._id)}>
                                    <div className="aspect-square relative rounded-full w-10 h-10 flex items-center justify-center bg-slate-600 text-white">
                                        <i className="ri-user-fill text-lg"></i>
                                    </div>
                                    <span className="font-medium text-base">{user.email}</span>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addCollaborators}
                            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition">
                            Add Collaborators
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Project