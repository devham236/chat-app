import React, { useEffect, useState } from "react"
import io from "socket.io-client"
import useCustomContext from "./../Context/CustomContext"
import Message from "./Message"
import ScrollToBottom from "react-scroll-to-bottom"
import axios from "../axiosConfig"

const socket = io.connect("http://localhost:3000")

const HomeContainer = () => {
  const { userInfo } = useCustomContext()
  const [error, setError] = useState(null)
  const [searchInput, setSearchInput] = useState("")
  const [searchResult, setSearchResult] = useState(null)
  const [chats, setChats] = useState(null)
  const [selectedChat, setSelectedChat] = useState(null)
  const [otherUsers, setOtherUsers] = useState(null)
  const [message, setMessage] = useState("")
  const [messagesArray, setMessagesArray] = useState([])

  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      console.log(data)
      setMessagesArray((prev) => [...prev, data])
    })
  }, [socket])

  useEffect(() => {
    const getUsers = async () => {
      try {
        const result = await axios.get("/user/list")
        const filteredList = result.data.usersList.filter(
          (user) => user._id !== userInfo?._id
        )
        setOtherUsers(filteredList)
      } catch (error) {
        console.log(error)
      }
    }
    getUsers()
  }, [])

  useEffect(() => {
    const getChats = async () => {
      const result = await axios.get(
        `/chat/chats?username=${userInfo?.username}`
      )
      setChats(result.data.chats)
    }
    getChats()
  }, [])

  const searchUser = async () => {
    if (searchInput !== "") {
      try {
        const result = await axios.get(`/user/users?search=${searchInput}`)
        const filteredList = result.data.users.filter(
          (user) => user._id !== userInfo._id
        )
        setSearchResult(filteredList)
      } catch (error) {
        console.log(error)
        setError(error.response.data.message)
      }
    }
  }

  const createChat = async (user) => {
    try {
      const result = await axios.post("/chat/create", {
        roomName: `${user.username}_and_${userInfo.username}`,
        participants: [userInfo, user],
      })
      setChats((prev) => [...prev, result.data.newChat])
    } catch (error) {
      console.log(error)
    }
  }

  const joinRoom = async (chat) => {
    if (!selectedChat) {
      await socket.emit("joinRoom", chat.roomName)
      setSelectedChat(chat)
    } else {
      console.error("No chats")
    }
  }

  const deleteChat = async (chat, event) => {
    event.stopPropagation()
    try {
      const result = await axios.delete(`/chat/${chat._id}`)
      setChats(result.data.chats.length === 0 ? null : result.data.chats)
    } catch (error) {
      console.log(error)
    }
  }

  const sendMessage = async () => {
    if (message !== "") {
      const messageData = {
        room: selectedChat.roomName,
        author: userInfo.username,
        content: message,
        timestamp:
          new Date(Date.now()).getHours() +
          ":" +
          new Date(Date.now()).getMinutes(),
      }
      await socket.emit("sendMessage", messageData)
      const result = await axios.post("/chat/sendMessage", { messageData })
      setMessagesArray(result.data.chat.messages)
      setMessage("")
    }
  }

  return (
    <div className="w-full h-[calc(100%-80px)] rounded-b-2xl flex">
      {/*Sidebar*/}
      <div className="w-[30%] border-r-2 border-slate-200 dark-border max-h-full overflow-auto">
        <div className="w-full h-16 border-b-[2px] border-slate-200 dark-border flex items-center justify-between p-3">
          <input
            type="text"
            placeholder="Search for Users..."
            className="bg-transparent outline-none"
            onChange={(event) => {
              setSearchInput(event.target.value)
              setError(null)
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                searchUser()
              }
            }}
          />
          <button
            onClick={searchUser}
            className="px-4 py-2 rounded-lg bg-slate-200 font-bold hover:bg-blue-600 dark:bg-slate-900 dark:text-white hover:text-white duration-300 dark-button"
          >
            Search
          </button>
        </div>
        <div className="w-full flex flex-col">
          <div className="w-full h-[80px] p-3 border-b-2 cursor-pointer border-slate-200 dark-border flex items-center">
            <h1 className="font-bold text-lg dark:text-white">
              Search <span className="text-blue-600">Results:</span>
            </h1>
          </div>
          {searchResult &&
            searchResult.map((user) => (
              <div
                key={user._id}
                className={`w-full h-[80px] p-3 border-b-2 cursor-pointer border-slate-200 flex items-center`}
              >
                <div
                  style={{ backgroundColor: user.bgColor }}
                  className={`w-[65px] h-full rounded-full flex items-center justify-center`}
                >
                  <p
                    style={{ textShadow: "0px 0px 8px #000" }}
                    className="font-semibold text-white text-2xl"
                  >
                    {user.username.charAt(0)}
                  </p>
                </div>
                <div className="ml-2 flex w-full items-center justify-between">
                  <div className="">
                    <p className="font-bold">{user.username}</p>
                  </div>
                  <div
                    onClick={() => createChat(user)}
                    className="opacity-50 hover:text-blue-600 hover:border-blue-600 hover:opacity-100 cursor-pointer duration-300 border-[3px] border-slate-200 flex items-center justify-center p-2 rounded-lg"
                  >
                    <i className="fa-solid fa-plus text-md"></i>
                  </div>
                </div>
              </div>
            ))}
          {error && (
            <div className="w-full h-[80px] duration-300 p-3 border-b-2 cursor-pointer border-slate-200 flex items-center">
              <p className="italic text-slate-500">{error}...</p>
            </div>
          )}
          <div className="w-full h-[80px] p-3 border-b-2 cursor-pointer border-slate-200 dark-border flex items-center">
            <h1 className="font-bold text-lg dark:text-white">
              Your <span className="text-blue-600">Chats:</span>
            </h1>
          </div>
          {chats &&
            chats.map((chat) => (
              <div
                onClick={() => joinRoom(chat)}
                key={chat._id}
                className={`w-full h-[80px] hover:bg-slate-100 dark:hover:bg-slate-900 duration-300 p-3 border-b-2 cursor-pointer border-slate-200 dark-border flex items-center`}
              >
                <div className="w-[70px] h-full relative">
                  {chat.participants.map((p, i) => (
                    <div
                      style={{ backgroundColor: p.bgColor }}
                      key={i}
                      className={`w-[70%] h-[70%] rounded-full flex items-center justify-center absolute ${
                        p._id === userInfo._id
                          ? "top-0 left-0"
                          : "bottom-0 right-0 z-30"
                      }`}
                    >
                      <p
                        className="font-bold text-2xl text-white"
                        style={{ textShadow: "0px 0px 8px #000" }}
                      >
                        {p.username.charAt(0)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="ml-2 flex w-full items-center justify-between">
                  <div className="">
                    <div className="flex">
                      {chat.participants
                        .filter(
                          (participant) => participant._id !== userInfo._id
                        )
                        .map((p, i) => (
                          <h2
                            key={i}
                            className="font-bold mr-2 last:mr-0 dark:text-white"
                          >
                            {p.username}
                          </h2>
                        ))}
                    </div>
                    <p className="text-sm opacity-50 dark:text-white">
                      Room: {chat.roomName}
                    </p>
                  </div>
                  <div
                    onClick={(event) => deleteChat(chat, event)}
                    className="opacity-50 hover:text-white hover:bg-blue-600 hover:opacity-100 cursor-pointer duration-300 bg-slate-200 px-2 flex items-center justify-center py-2 rounded-full"
                  >
                    <i className="fa-solid fa-trash-can text-md"></i>
                  </div>
                </div>
              </div>
            ))}
          <div className="w-full h-[80px] p-3 border-b-2 cursor-pointer border-slate-200 dark-border flex items-center">
            <h1 className="font-bold text-lg dark:text-white">
              Other <span className="text-blue-600">Users:</span>
            </h1>
          </div>
          {otherUsers &&
            otherUsers.map((user) => (
              <div
                key={user._id}
                className={`w-full h-[80px] p-3 border-b-2 cursor-pointer border-slate-200 dark-border flex items-center`}
              >
                <div
                  style={{ backgroundColor: user.bgColor }}
                  className={`w-[65px] h-full rounded-full flex items-center justify-center`}
                >
                  <p
                    className="font-bold text-2xl text-white"
                    style={{ textShadow: "0px 0px 8px #000" }}
                  >
                    {user.username.charAt(0)}
                  </p>
                </div>
                <div className="ml-2 flex w-full items-center justify-between">
                  <div className="">
                    <p className="font-bold dark:text-white">{user.username}</p>
                  </div>
                  {chats?.find((chat) =>
                    chat.roomName.includes(user.username)
                  ) ? (
                    <div
                      onClick={() => createChat(user)}
                      className="cursor-pointer duration-300 border-[3px] border-slate-200 dark:border-slate-400 dark:text-slate-400 flex items-center justify-center p-2 rounded-lg"
                    >
                      <i className="fa-solid fa-check"></i>
                    </div>
                  ) : (
                    <div
                      onClick={() => createChat(user)}
                      className="cursor-pointer border-[3px] border-slate-200 dark:border-slate-400 dark:text-slate-400 flex items-center justify-center p-2 rounded-lg hover:text-blue-600 hover:border-blue-600 dark:hover:border-blue-600 dark:hover:text-blue-600 duration-300"
                    >
                      <i className="fa-solid fa-plus"></i>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
      {/*Chat */}
      {selectedChat ? (
        <div className="w-[70%] h-full">
          <div className="w-full h-[calc(100%-80px)]">
            <div className="w-full h-16 border-b-[1px] border-slate-200 dark-border p-3 flex items-center">
              <h2 className="font-semibold dark:text-white">
                Room: {selectedChat.roomName}
              </h2>
            </div>
            <ScrollToBottom className="w-full max-h-[calc(100%-64px)] overflow-auto p-3 flex flex-col">
              {messagesArray?.map((message, i) => (
                <Message message={message} key={i} />
              ))}
            </ScrollToBottom>
          </div>
          <div className="w-full py-3 h-[80px] border-t-[1px] border-slate-200 px-3 dark-border">
            <div className="w-full h-full flex items-center">
              <input
                type="text"
                name="message"
                value={message}
                placeholder="Message..."
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(e) => {
                  e.key === "Enter" && sendMessage()
                }}
                className="w-full h-full px-3 rounded-lg bg-slate-200 dark:bg-slate-900 outline-none dark:text-white"
              />
              <div
                className="bg-blue-600 ml-2 h-full flex items-center justify-center px-4 rounded-lg cursor-pointer hover:shadow-lg duration-200"
                onClick={sendMessage}
              >
                <i className="fa-solid fa-paper-plane text-white"></i>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-[70%] h-full flex items-center justify-center">
          <div className="dark:bg-slate-900 w-[500px] h-[300px] bg-slate-200 rounded-lg flex items-center justify-center">
            <h1 className="font-bold text-lg dark:text-white">
              Select a chat to start texting.
            </h1>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomeContainer